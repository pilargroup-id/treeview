import { Fragment, useEffect, useMemo, useState } from 'react'
import { ChevronDown } from '@untitledui/icons'

function resolveRowId(row, index, getRowId) {
  if (typeof getRowId === 'function') {
    return getRowId(row, index)
  }

  return row?.id ?? row?.recid ?? index
}

function renderCellValue(column, row, index) {
  if (typeof column.render === 'function') {
    return column.render(row, index)
  }

  if (typeof column.accessor === 'function') {
    return column.accessor(row, index)
  }

  const value = row?.[column.key]
  return value === undefined || value === null || value === '' ? '-' : value
}

function resolveColumnGroup(group) {
  if (!group) {
    return null
  }

  if (typeof group === 'string') {
    const label = group.trim()
    return label ? { key: label, label } : null
  }

  const rawKey = group.key ?? group.id ?? null
  const key = rawKey == null ? '' : String(rawKey).trim()
  const label =
    group.label == null && group.header == null ? '' : String(group.label ?? group.header)

  if (!key && !label.trim()) {
    return null
  }

  return {
    key: key || label.trim(),
    label,
    align: group.align,
    className: group.className,
    style: group.style,
  }
}

function buildHeaderCellStyle(style, align = 'left') {
  return {
    ...(style ?? {}),
    textAlign: style?.textAlign ?? align,
  }
}

function joinClassNames(...values) {
  return values.filter(Boolean).join(' ')
}

export function buildPaginationItems(totalPages, currentPage) {
  if (totalPages <= 1) {
    return [1]
  }

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const items = [1]
  const startPage = Math.max(2, currentPage - 1)
  const endPage = Math.min(totalPages - 1, currentPage + 1)

  if (startPage > 2) {
    items.push('ellipsis-start')
  }

  for (let page = startPage; page <= endPage; page += 1) {
    items.push(page)
  }

  if (endPage < totalPages - 1) {
    items.push('ellipsis-end')
  }

  items.push(totalPages)
  return items
}

export function buildPaginationModel({
  totalItems = 0,
  page = 0,
  pageSize = 25,
  pageSizeOptions = [],
  label = 'data',
  onPageChange,
  onPageSizeChange,
}) {
  const safeTotalItems = Number.isFinite(totalItems) ? Math.max(0, totalItems) : 0
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 25
  const safePageSizeOptions = Array.isArray(pageSizeOptions)
    ? pageSizeOptions.filter((option) => Number.isFinite(option) && option > 0)
    : []
  const totalPages = Math.max(1, Math.ceil(safeTotalItems / safePageSize))
  const currentPage = Math.min(Math.max(1, page + 1), totalPages)
  const startItem = safeTotalItems === 0 ? 0 : (currentPage - 1) * safePageSize + 1
  const endItem = safeTotalItems === 0 ? 0 : Math.min(currentPage * safePageSize, safeTotalItems)
  const itemLabel = String(label).trim() || 'data'

  return {
    currentPage,
    totalPages,
    items: buildPaginationItems(totalPages, currentPage),
    summary:
      safeTotalItems === 0
        ? `Tidak ada ${itemLabel}`
        : `Menampilkan ${startItem}-${endItem} dari ${safeTotalItems} ${itemLabel}`,
    pageSize: safePageSize,
    pageSizeOptions: safePageSizeOptions,
    onPrevious: () => onPageChange?.(Math.max(0, currentPage - 2)),
    onNext: () => onPageChange?.(Math.min(totalPages - 1, currentPage)),
    onSelect: (selectedPage) => onPageChange?.(Math.max(0, Number(selectedPage) - 1)),
    onPageSizeChange: (selectedPageSize) => onPageSizeChange?.(Number(selectedPageSize)),
  }
}

function DataTable({
  columns = [],
  rows = [],
  emptyMessage = 'Tidak ada data',
  pagination = null,
  getRowId,
  detailRenderer,
  getDetailTitle,
  getDetailDescription,
  detailLabel = 'Detail',
  scrollBody = false,
  scrollBodyMaxHeight = 'min(38vh, 360px)',
  wrapperTopMargin = null,
  fillHeight = false,
}) {
  const [expandedRowId, setExpandedRowId] = useState(null)
  const hasDetail = typeof detailRenderer === 'function'
  const decoratedColumns = useMemo(() => {
    return columns.map((column, index) => {
      const currentGroup = resolveColumnGroup(column.group)
      const nextColumn = columns[index + 1]
      const nextGroup = nextColumn ? resolveColumnGroup(nextColumn.group) : null
      const currentGroupKey = currentGroup?.key ?? `column-${column.key}`
      const nextGroupKey = nextGroup?.key ?? `column-${nextColumn?.key ?? index + 1}`
      const hasGroupDivider = index < columns.length - 1 && currentGroupKey !== nextGroupKey

      return {
        ...column,
        hasGroupDivider,
      }
    })
  }, [columns])
  const headerGroups = useMemo(() => {
    const groupedColumns = []
    const topRow = []

    for (const column of decoratedColumns) {
      const group = resolveColumnGroup(column.group)

      if (!group) {
        topRow.push({
          key: `column-${column.key}`,
          header: column.header,
          rowSpan: 2,
          align: column.align,
          className: column.headerClassName,
          style: column.headerStyle,
          scope: 'col',
        })
        continue
      }

      const lastGroup = topRow[topRow.length - 1]

      if (lastGroup?.scope === 'colgroup' && lastGroup.groupKey === group.key) {
        lastGroup.colSpan += 1
      } else {
        topRow.push({
          key: `group-${group.key}-${topRow.length}`,
          groupKey: group.key,
          header: group.label,
          colSpan: 1,
          align: group.align ?? 'center',
          className: group.className,
          style: group.style,
          scope: 'colgroup',
        })
      }

      groupedColumns.push(column)
    }

    const hasGroupedColumns = groupedColumns.length > 0

    return {
      hasGroupedColumns,
      topRow,
      bottomRow: hasGroupedColumns ? groupedColumns : decoratedColumns,
    }
  }, [decoratedColumns])

  const rowIdsKey = useMemo(
    () =>
      rows
        .map((row, index) => String(resolveRowId(row, index, getRowId)))
        .join('|'),
    [getRowId, rows],
  )

  useEffect(() => {
    if (!hasDetail) {
      setExpandedRowId(null)
      return
    }

    setExpandedRowId((currentExpandedRowId) => {
      if (currentExpandedRowId === null) {
        return null
      }

      return rows.some(
        (row, index) => resolveRowId(row, index, getRowId) === currentExpandedRowId,
      )
        ? currentExpandedRowId
        : null
    })
  }, [getRowId, hasDetail, rowIdsKey, rows])

  const toggleRow = (rowId) => {
    if (!hasDetail) {
      return
    }

    setExpandedRowId((currentExpandedRowId) =>
      currentExpandedRowId === rowId ? null : rowId,
    )
  }

  const resolvedWrapperTopMargin = wrapperTopMargin ?? (fillHeight ? '8px' : null)

  const tableWrapperStyle =
    scrollBody || resolvedWrapperTopMargin !== null
      ? {
          ...(scrollBody ? { '--users-table-scroll-max-height': scrollBodyMaxHeight } : {}),
          ...(resolvedWrapperTopMargin !== null
            ? { '--users-table-top-margin': resolvedWrapperTopMargin }
            : {}),
        }
      : undefined

  return (
    <div className={joinClassNames('users-table-shell', fillHeight && 'users-table-shell--fill')}>
      <div
        className={joinClassNames(
          'users-table-wrapper',
          scrollBody && 'users-table-wrapper--scroll-body',
        )}
        style={tableWrapperStyle}
      >
        <table
          className={joinClassNames(
            'users-table',
            headerGroups.hasGroupedColumns && 'users-table--grouped-header',
          )}
        >
          <thead>
            {headerGroups.hasGroupedColumns ? (
              <>
                <tr className="users-table__header-row users-table__header-row--grouped">
                  {headerGroups.topRow.map((cell, index) => {
                    const hasDivider = index < headerGroups.topRow.length - 1

                    return (
                      <th
                        key={cell.key}
                        scope={cell.scope}
                        rowSpan={cell.rowSpan}
                        colSpan={cell.colSpan}
                        className={joinClassNames(
                          cell.className,
                          hasDivider && 'users-table__cell--group-divider',
                        )}
                        style={buildHeaderCellStyle(cell.style, cell.align)}
                      >
                        {cell.header}
                      </th>
                    )
                  })}
                  {hasDetail ? (
                    <th
                      scope="col"
                      rowSpan={2}
                      className={joinClassNames(
                        'users-table__detail-header',
                        headerGroups.topRow.length > 0 && 'users-table__cell--group-divider',
                      )}
                      style={buildHeaderCellStyle(null, 'center')}
                    >
                      {detailLabel}
                    </th>
                  ) : null}
                </tr>

                <tr className="users-table__header-row users-table__header-row--leaf">
                  {headerGroups.bottomRow.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className={joinClassNames(
                        column.headerClassName,
                        column.hasGroupDivider && 'users-table__cell--group-divider',
                      )}
                      style={buildHeaderCellStyle(column.headerStyle, column.align)}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </>
            ) : (
              <tr className="users-table__header-row">
                {decoratedColumns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={joinClassNames(
                      column.headerClassName,
                      column.hasGroupDivider && 'users-table__cell--group-divider',
                    )}
                    style={buildHeaderCellStyle(column.headerStyle, column.align)}
                  >
                    {column.header}
                  </th>
                ))}
                {hasDetail ? (
                  <th scope="col" className="users-table__detail-header">
                    {detailLabel}
                  </th>
                ) : null}
              </tr>
            )}
          </thead>

          <tbody>
            {rows.length > 0 ? (
              rows.map((row, index) => {
                const rowId = resolveRowId(row, index, getRowId)
                const isExpanded = expandedRowId === rowId
                const accordionId = `data-table-accordion-${rowId}`
                const detailTitle = getDetailTitle?.(row, index)
                const detailDescription = getDetailDescription?.(row, index)

                return (
                  <Fragment key={rowId}>
                    <tr
                      className={`users-table__row${isExpanded ? ' users-table__row--expanded' : ''}`}
                      onClick={hasDetail ? () => toggleRow(rowId) : undefined}
                      onKeyDown={
                        hasDetail
                          ? (event) => {
                              if (event.key !== 'Enter' && event.key !== ' ') {
                                return
                              }

                              event.preventDefault()
                              toggleRow(rowId)
                            }
                          : undefined
                      }
                      tabIndex={hasDetail ? 0 : undefined}
                      aria-expanded={hasDetail ? isExpanded : undefined}
                      aria-controls={hasDetail ? accordionId : undefined}
                    >
                      {decoratedColumns.map((column) => (
                        <td
                          key={`${rowId}-${column.key}`}
                          className={joinClassNames(
                            column.cellClassName,
                            headerGroups.hasGroupedColumns &&
                              column.hasGroupDivider &&
                              'users-table__cell--group-divider',
                          )}
                          style={column.style ?? { textAlign: column.align ?? 'left' }}
                        >
                          {renderCellValue(column, row, index)}
                        </td>
                      ))}

                      {hasDetail ? (
                        <td className="users-table__detail-cell">
                          <button
                            type="button"
                            className="users-table__detail-button"
                            onClick={(event) => {
                              event.stopPropagation()
                              toggleRow(rowId)
                            }}
                            aria-expanded={isExpanded}
                            aria-controls={accordionId}
                            title={isExpanded ? 'Tutup detail' : 'Buka detail'}
                          >
                            <span>{detailLabel}</span>
                            <ChevronDown
                              size={16}
                              aria-hidden="true"
                              className={`users-table__detail-icon${
                                isExpanded ? ' users-table__detail-icon--open' : ''
                              }`}
                            />
                          </button>
                        </td>
                      ) : null}
                    </tr>

                    {hasDetail && isExpanded ? (
                      <tr className="users-table__accordion-row">
                        <td colSpan={columns.length + 1}>
                          <div className="users-table__accordion" id={accordionId}>
                            {detailTitle || detailDescription ? (
                              <div className="users-table__accordion-header">
                                <div className="users-table__accordion-copy">
                                  {detailTitle ? (
                                    <h3 className="users-table__accordion-title">{detailTitle}</h3>
                                  ) : null}
                                  {detailDescription ? (
                                    <p className="users-table__accordion-description">
                                      {detailDescription}
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                            ) : null}

                            {detailRenderer(row, index)}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                )
              })
            ) : (
              <tr>
                <td colSpan={columns.length + (hasDetail ? 1 : 0)}>
                  <div className="users-table__empty">{emptyMessage}</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination ? (
        <div className="users-table-pagination">
          <div className="users-table-pagination__meta">
            {Array.isArray(pagination.pageSizeOptions) && pagination.pageSizeOptions.length > 0 ? (
              <label className="users-table-pagination__page-size">
                <span>Rows</span>
                <select
                  className="users-table-pagination__select"
                  value={pagination.pageSize}
                  onChange={(event) => pagination.onPageSizeChange?.(event.target.value)}
                  aria-label="Rows per page"
                >
                  {pagination.pageSizeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <p className="users-table-pagination__summary">{pagination.summary}</p>
          </div>

          <div className="users-table-pagination__controls" aria-label="Table pagination">
            <button
              type="button"
              className="users-table-pagination__button"
              onClick={pagination.onPrevious}
              disabled={pagination.currentPage === 1}
            >
              Previous
            </button>

            {pagination.items.map((item, index) =>
              typeof item === 'number' ? (
                <button
                  key={item}
                  type="button"
                  className={`users-table-pagination__button${
                    item === pagination.currentPage ? ' users-table-pagination__button--active' : ''
                  }`}
                  onClick={() => pagination.onSelect(item)}
                  aria-current={item === pagination.currentPage ? 'page' : undefined}
                >
                  {item}
                </button>
              ) : (
                <span
                  key={`${item}-${index}`}
                  className="users-table-pagination__ellipsis"
                  aria-hidden="true"
                >
                  ...
                </span>
              ),
            )}

            <button
              type="button"
              className="users-table-pagination__button"
              onClick={pagination.onNext}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default DataTable
