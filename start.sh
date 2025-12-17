docker compose down


docker compose up -d zookeeper
sleep 10

docker compose up -d kafka
sleep 15

docker compose up -d namenode datanode
sleep 10

docker compose up -d hadoop-init
sleep 10


docker compose up -d kafka-consumer


