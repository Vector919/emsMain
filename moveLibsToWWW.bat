@echo off
copy /y node_modules\jquery\dist\jquery.min.js www\js\jquery.min.js 
copy /y node_modules\mustache\mustache.min.js www\js\mustache.min.js
copy /y node_modules\bootstrap\dist\css\*.min.css www\css\*
copy /y node_modules\bootstrap\dist\js\*.min.js www\js\*
copy /y node_modules\bootstrap\dist\fonts\* www\fonts\*
copy /y node_modules\intl-tel-input\build\css\* www\css\*
copy /y node_modules\intl-tel-input\build\img\* www\img\*
copy /y node_modules\intl-tel-input\build\js\* www\js\*

echo on