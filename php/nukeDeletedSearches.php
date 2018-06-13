<?php
	session_start();
    include('../../vendor/php/utils.php');
	//you could comment out the following line and have no login authentication. 
	ajaxBootOut();

	include('../../connectionString.php');

	//open connection
	$dbconn = pg_connect($connectionString)
		or die('Could not connect: ' . pg_last_error());
	try {	
        pg_query("BEGIN") or die("Could not start transaction\n");
        //error_log (print_r ($_SESSION, true));
        //error_log (print_r ($_POST, true));
        set_time_limit (5 * 60);
        
        $userRights = getUserRights ($dbconn, $_SESSION['user_id']);

		/*
        if ($userRights["isSuperUser"]) {
            
            if ($_POST["deleteFiles"]) {
                pg_prepare ($dbconn, "getDeadAcquisitionFiles", "
                    select file_path from run where run.acq_id in

                    (
                    (select distinct search_acquisition.acq_id
                    from search, search_acquisition 
                    where search.hidden = 'true' and search.id = search_acquisition.search_id)

                    EXCEPT

                    (select distinct search_acquisition.acq_id
                    from search, search_acquisition
                    where coalesce (search.hidden, false) = false and search.id = search_acquisition.search_id)
                    )"
                );

                $result = pg_execute($dbconn, "getDeadAcquisitionFiles", []);
                $rows = resultsAsArray ($result);
                foreach($rows as $row) {
                    $filename = $row['file_path'];
                    if (file_exists($filename)) {
                        $unlink($filename); // permanent deletion
                    }
                }  


                pg_prepare ($dbconn, "getDeadSequenceFiles", "
                    select file_path from sequence_file where sequence_file.id in

                    (
                    (select distinct search_sequencedb.seqdb_id
                    from search, search_sequencedb 
                    where search.hidden = 'true' and search.id = search_sequencedb.search_id)

                    EXCEPT

                    (select distinct search_sequencedb.seqdb_id
                    from search, search_sequencedb 
                    where coalesce (search.hidden, false) = false and search.id = search_sequencedb.search_id)
                    )"
                );

                $result = pg_execute($dbconn, "getDeadSequenceFiles", []);
                $rows = resultsAsArray ($result);
                foreach($rows as $row) {
                    $filename = $row['file_path'];
                    if (file_exists($filename)) {
                        $unlink($filename); // permanent deletion
                    }
                }  
            }
            
            pg_prepare ($dbconn, "deleteSearches", "DELETE from search where hidden = 'true'"); // has delete cascade to sequence / acquisition etc
            $result = pg_execute($dbconn, "deleteSearches", []);
            $rows = resultsAsArray ($result);
            
            pg_prepare ($dbconn, "deleteSpectra", "DELETE from spectrum sp inner join search_acquisition sa on sp.acq_id = sa.acq_id and sp.run_id = sa.run_id inner join search s on sa.search_id = s.id where s.hidden;");
            $result = pg_execute($dbconn, "deleteSpectra", []);
            $rows = resultsAsArray ($result);         
        }
		*/
        
        pg_query("COMMIT");
        echo json_encode (array(
            "status"=>"success"
        ));
    } catch (Exception $e) {
        pg_query("ROLLBACK");
        echo (json_encode(array ("status"=>"fail", "error"=> "An Error occurred when attempting to delete dead searches<br>".$_POST["searchID"])));
    }

    //close connection
    pg_close($dbconn);
?>
