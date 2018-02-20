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
        //error_log (print_r ($_SESSION, true));
        if (isset($_POST["searchID"])) {
			$userRights = getUserRights ($dbconn, $_SESSION['user_id']);
			pg_prepare ($dbconn, "getSearch", "SELECT uploadedby, is_executing, hidden FROM search WHERE id = $1");
			$result = pg_execute ($dbconn, "getSearch", [$_POST["searchID"]]);
			$row = pg_fetch_assoc ($result);

			// if search isn't executing and either 1. user is search owner and search isn't hidden or 2. user is superuser, then update search to restart it
			if (isTrue($row["is_executing"]) && (($row["uploadedby"] === $_SESSION['user_id'] && !isTrue($row["hidden"])) || $userRights["isSuperUser"])) {
				pg_prepare ($dbconn, "restartSearch", "UPDATE search SET is_executing = TRUE, status = 'queuing', hidden = FALSE WHERE id = $1");
				$result = pg_execute ($dbconn, "restartSearch", [$_POST["searchID"]]);
			}
		}
        
        pg_query("COMMIT");
        echo json_encode (array("status"=>"success", "result"=>$result));
    } catch (Exception $e) {
        pg_query("ROLLBACK");
        echo (json_encode(array ("status"=>"fail", "error"=> "An Error occurred when attempting to restart search id<br>".$_POST["searchID"])));
    }

    //close connection
    pg_close($dbconn);
?>
