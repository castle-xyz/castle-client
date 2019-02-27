#!/bin/bash

cd /local/game
tar xvzf filebeat-6.6.1-linux-x86_64.tar.gz

rm filebeat-6.6.1-linux-x86_64/filebeat.yml
cp filebeat.yml filebeat-6.6.1-linux-x86_64/filebeat.yml

cd filebeat-6.6.1-linux-x86_64
sudo chown root filebeat.yml
sudo ./filebeat -e -c filebeat.yml &

echo 'Installed Castle' > install.log