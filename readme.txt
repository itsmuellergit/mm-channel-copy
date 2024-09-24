mmctl auth login https://itsmueller3.spdns.org --name mattermost --username christof --password
mmctl auth login https://itsmueller3.spdns.org --name mattermost --username franziska --password
mmctl team list   --json
mmctl team create --name cmtestteam2 --display-name "cmtest team2"
mmctl channel list svh-staffel-12 --json
mmctl channel create --team testgruppesvh --name 00--1carmen-fallbesprechung --display-name "00  1Carmen Fallbesprechung"
