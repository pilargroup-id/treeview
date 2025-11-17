import React from "react";
import "./Sidebar.css";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Dashboard</h2>
      </div>
      <ul className="sidebar-menu">
        <li className="active">
          <i className="fas fa-home"></i> Home
        </li>
        <li>
          <i className="fas fa-chart-bar"></i> Analytics
        </li>
        <li>
          <i className="fas fa-folder"></i> Projects
        </li>
        <li>
          <i className="fas fa-cog"></i> Settings
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
