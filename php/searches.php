<?php
	session_start();
	//you could comment out following 4 lines and have no login authentication. 
	if (!$_SESSION['session_name']) {
		header("location:login.html");
		exit;
	}
	include('../../connectionString.php');
    include('./rights.php');

	//open connection
	$dbconn = pg_connect($connectionString)
		or die('Could not connect: ' . pg_last_error());
		
    //error_log (print_r ($_SESSION, true));
    //error_log (print_r ($_POST, true));
	$searches = $_POST["searches"];
    $userRights = getUserRights ($dbconn, $_SESSION['user_id']);
	
	if ($searches == "MINE" || !$userRights["canSeeAll"]){
		pg_prepare($dbconn, "my_query",
		"SELECT search.id, search.notes, (array_agg(user_name))[1] as user_name, (array_agg(search.submit_date))[1] AS submit_date, (array_agg(search.name))[1] AS name, (array_agg(search.status))[1] AS status, (array_agg(search.random_id))[1] AS random_id, array_agg(sequence_file.file_name) AS file_name FROM search, users, search_sequencedb, sequence_file WHERE search.uploadedby = users.id AND search.id = search_sequencedb.search_id AND search_sequencedb.seqdb_id = sequence_file.id AND users.user_name = $1 AND status != 'hide' GROUP BY search.id ORDER BY (CASE WHEN status = 'queuing' THEN 0 WHEN is_executing THEN 1 ELSE 2 END) ASC, search.id DESC ;");
		$result = pg_execute($dbconn, "my_query", [$_SESSION['session_name']]);
	}
	else {
		$q = 
		"SELECT search.id, search.notes, (array_agg(user_name))[1] as user_name, (array_agg(search.submit_date))[1] AS submit_date, (array_agg(search.name))[1] AS name, (array_agg(search.status))[1] AS status, (array_agg(search.random_id))[1] AS random_id, array_agg(sequence_file.file_name) AS file_name FROM search, users, search_sequencedb, sequence_file WHERE search.uploadedby = users.id AND search.id = search_sequencedb.search_id AND search_sequencedb.seqdb_id = sequence_file.id AND status != 'hide' GROUP BY search.id ORDER BY (CASE WHEN status = 'queuing' THEN 0 WHEN is_executing THEN 1 ELSE 2 END) ASC, search.id DESC ;";	
		$result = pg_query($q) or die('Query failed: ' . pg_last_error());
	}

    echo json_encode (array("user"=>$_SESSION['session_name'], "data"=>pg_fetch_all($result)));

    //close connection
    pg_close($dbconn);
?>
