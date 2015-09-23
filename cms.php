<?php
  error_reporting(E_ERROR);
  chmod('db', 0777);

  function saveField($fieldID, $fieldText) {
    $file = 'db/'.$fieldID.'.txt';
    // Open the file to get existing content
    // $current = file_get_contents($file);
    // Write the contents back to the file
    file_put_contents($file, $fieldText);

    echo 'OK';
  }

  function loadField($fieldID) {
    $file = 'db/'.$fieldID.'.txt';
    // Open the file to get existing content
    $fieldText = file_get_contents($file);

    echo $fieldText;
  }


  date_default_timezone_set('America/New_York');

  $action = $_POST['action'];

  switch($action){
    case "save":
      $id = $_POST['id'];
      $text = $_POST['text'];

      echo saveField($id, $text);
      break;
    case "load":
      $id = $_POST['id'];

      echo loadField($id);
      break;
  }

?>
