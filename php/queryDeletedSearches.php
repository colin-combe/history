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
        $userRights = getUserRights ($dbconn, $_SESSION['user_id']);

        if ($userRights["isSuperUser"]) {
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
            
            $acqFilesizes = array();
            foreach($rows as $row) {
                $filename = $row['file_path'];
                if (file_exists($filename)) {
                    $array_push ($acqFilesizes, filesize($filename));
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
            
            $seqFilesizes = array();
            foreach($rows as $row) {
                $filename = $row['file_path'];
                if (file_exists($filename)) {
                    $array_push ($seqFilesizes, filesize($filename));
                }
            }  
            
            pg_prepare ($dbconn, "getDeadSearchCount", "select count(*) from search where hidden = 'true'");
            $result = pg_execute($dbconn, "getDeadSearchCount", []);
            $rows = resultsAsArray ($result);
            $deadSearchCount = $rows[0]['count'];
        }
        
        pg_query("COMMIT");
        echo json_encode (array(
            "status"=>"success", 
            "acqFilesizes"=>$acqFilesizes, 
            "seqFilesizes"=>$seqFilesizes,
            "deadSearches"=>$deadSearchCount 
        ));
    } catch (Exception $e) {
        pg_query("ROLLBACK");
        echo (json_encode(array ("status"=>"fail", "error"=> "An Error occurred when attempting to query dead searches<br>".$_POST["searchID"])));
    }

    //close connection
    pg_close($dbconn);
?>
