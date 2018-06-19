<?php
    session_start();
    include('../../vendor/php/utils.php');
    //you could comment out the following line and have no login authentication.
    ajaxBootOut();

    include('../../connectionString.php');
    //open connection
    try {
        // @ suppresses non-connection throwing an uncatchable error, so we can generate our own error to catch
        $dbconn = pg_connect($connectionString) or die('Could not connect: ' . pg_last_error());

        if ($dbconn) {
            //error_log (print_r ($_SESSION, true));
            //error_log (print_r ($_POST, true));

            $qPart1 = "select * from uploads where user_id = $1;";
            pg_prepare($dbconn, "my_query", $qPart1);
            $result = pg_execute($dbconn, "my_query", [0]);//, [$_SESSION['user_id']]);
            echo json_encode (array("user"=>$_SESSION['session_name'], "data"=>pg_fetch_all($result)));

            //close connection
            pg_close($dbconn);
        } else {
            throw new Exception ("Cannot connect to Database ☹");
        }
    }
    catch (Exception $e) {
        if ($dbconn) {
            pg_close ($dbconn);
        }
        $msg = $e->getMessage();
        echo (json_encode(array ("status"=>"fail", "error"=> "Error - ".$msg)));
    }
?>
