<?php
	session_start();
    include('./utils.php');
	//you could comment out the following line and have no login authentication. 
	ajaxBootOut();

	include('../../connectionString.php');

	//open connection
	$dbconn = pg_connect($connectionString)
		or die('Could not connect: ' . pg_last_error());
	try {	
        pg_query("BEGIN") or die("Could not start transaction\n");
        error_log (print_r ($_SESSION, true));
        error_log (print_r ($_POST, true));
        $userRights = getUserRights ($dbconn, $_SESSION['user_id']);

        pg_prepare ($dbconn, "getSearch", "SELECT uploadedby FROM search WHERE id = $1");
        $result = pg_execute ($dbconn, "getSearch", [$_POST["searchID"]]);
        $row = pg_fetch_assoc ($result);
        $searchUserID = $row["uploadedby"];

        if ($searchUserID === $_SESSION['user_id'] || $userRights["isSuperUser"]){
            //pg_prepare ($dbconn, "deleteSearch", "DELETE FROM search WHERE id = $1");
            pg_prepare ($dbconn, "deleteSearch", "UPDATE search SET hidden = true WHERE id = $1");
            $result = pg_execute($dbconn, "deleteSearch", [$_POST["searchID"]]);
        }
        
        pg_query("COMMIT");
        echo json_encode (array("status"=>"success"));
    } catch (Exception $e) {
        pg_query("ROLLBACK");
        echo (json_encode(array ("status"=>"fail", "error"=> "An Error occurred when attempting to delete search id<br>".$_POST["searchID"])));
    }

    //close connection
    pg_close($dbconn);
?>
