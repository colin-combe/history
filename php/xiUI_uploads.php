<?php
    session_start();
    include('../../vendor/php/utils.php');
    //you could comment out the following line and have no login authentication.
    //ajaxBootOut();

    include('../../connectionString.php');
    //open connection
    try {
        // @ suppresses non-connection throwing an uncatchable error, so we can generate our own error to catch
        $dbconn = pg_connect($connectionString) or die('Could not connect: ' . pg_last_error());

        if ($dbconn) {
            //error_log (print_r ($_SESSION, true));
            //error_log (print_r ($_POST, true));
            //~ $searches = $_POST["searches"];
            $userRights["canAddNewSearch"] = true;//getUserRights ($dbconn, $_SESSION['user_id']);
            $userRights["doesUserGUIExist"] = true;//getUserRights ($dbconn, $_SESSION['user_id']);

            /*
            $qPart1 = "SELECT id, notes, user_name, submit_date, name, status, random_id, hidden, file_name, enzyme, crosslinkers from

            (select search.id, search.is_executing, search.hidden, search.notes, user_name as user_name, search.submit_date AS submit_date,
            search.name AS name, search.status AS status, search.random_id AS random_id,
            string_agg(sequence_file.file_name,',') AS file_name
            FROM search
            INNER JOIN users on search.uploadedby = users.id

            INNER JOIN search_sequencedb on search.id = search_sequencedb.search_id
            INNER JOIN sequence_file on search_sequencedb.seqdb_id = sequence_file.id
             "
            ;

            // if can_see_all but not a superuser insert this clause
            $canSeeOthersPublic = "WHERE ((COALESCE (search.private, FALSE) = FALSE AND COALESCE (users.hidden, FALSE) = FALSE) OR search.uploadedby = $1) ";

            $canSeeMineOnly = "WHERE search.uploadedby = $1 ";
            $canSeeMineOnlyIJ = "WHERE search.uploadedby = $1 ";
            $innerJoinMine = ($searches == "MINE" ? $canSeeMineOnlyIJ : "");

            $hideHiddenSearches = " AND COALESCE (search.hidden, FALSE) = FALSE ";

            $qPart3 = "
            GROUP BY search.id, user_name) srch

            inner join (select enzyme.name as enzyme, search.id as id2
                from search
                inner join parameter_set on parameter_set.id = search.paramset_id
                inner join enzyme on enzyme.id = parameter_set.enzyme_chosen "
                .$innerJoinMine.
            ") enz on enz.id2 = srch.id

            inner join (select string_agg(crosslinker.name,',') as crosslinkers, search.id as id3
                from search
                inner join chosen_crosslinker on chosen_crosslinker.paramset_id = search.paramset_id
                inner join crosslinker on crosslinker.id = chosen_crosslinker.crosslinker_id "
                .$innerJoinMine.
                "group by search.id
            ) xlinker on xlinker.id3 = srch.id

            ORDER BY (CASE WHEN status = 'queuing' THEN 0 WHEN is_executing THEN 1 ELSE 2 END) ASC, srch.id DESC ;
            ";*/

            /*
            $qPart1 = "SELECT search.id, search.notes, user_name as user_name, search.submit_date AS submit_date, search.name AS name, search.status AS status, search.random_id AS random_id, sequence_file.file_name AS file_name, enzyme.name AS enzyme
                FROM search
                INNER JOIN users on search.uploadedby = users.id
                INNER JOIN search_sequencedb on search.id = search_sequencedb.search_id
                INNER JOIN sequence_file on search_sequencedb.seqdb_id = sequence_file.id
                INNER JOIN parameter_set on search.paramset_id = parameter_set.id
                INNER JOIN enzyme on parameter_set.enzyme_chosen = enzyme.id
                WHERE "
            ;

            // if can_see_all but not a superuser insert this clause
            $qPart2 = "((COALESCE (search.private, FALSE) = FALSE AND COALESCE (users.hidden, FALSE) = FALSE) OR search.uploadedby = $1) AND";

            $qPart3 = "
                COALESCE (search.hidden, FALSE) = FALSE
                GROUP BY search.id, user_name, file_name, enzyme
                ORDER BY (CASE WHEN status = 'queuing' THEN 0 WHEN is_executing THEN 1 ELSE 2 END) ASC, search.id DESC ;"
            ;
            */

            $qPart1 = "select * from uploads where user_id = $1;"
            ;


            //~ if (!$userRights["isSuperUser"] || $searches == "MINE") {
                //~ $privateClause = ($searches == "MINE" ? $canSeeMineOnly : $canSeeOthersPublic).(!$userRights["isSuperUser"] ? $hideHiddenSearches : "");
                pg_prepare($dbconn, "my_query", $qPart1);
                $result = pg_execute($dbconn, "my_query", [0]);//, [$_SESSION['user_id']]);
            //~ } else {
                //~ pg_prepare($dbconn, "my_query", $qPart1.$qPart3);
                //~ $result = pg_execute($dbconn, "my_query", []);
            //~ }

            //$utilsLogout = file_exists ("../../util/logout.php");

            echo json_encode (array("data"=>pg_fetch_all($result)));

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
