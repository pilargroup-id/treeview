<?php

use Illuminate\Support\Facades\Route;
use Google\Cloud\BigQuery\BigQueryClient;


Route::get('/', function () {
    return view('welcome');
});