# GameLiftLocal
## Documention
You can find the official GameLift documentation [here](https://aws.amazon.com/documentation/gamelift/).
## Using GameLiftLocal
### Minimum requirements:
GameLiftLocal requires the following:
* Java 8
* GameLift SDK version 3.1.5 or above

### Using GameLiftLocal
To run GameLiftLocal:
```sh
java -jar GameLiftLocal.jar
```

Use the -p command if you would like to change the port for the server listening for incoming client API calls:
```sh
java -jar GameLiftLocal.jar -p 9080
```

Next, run your GameLift SDK integrated server. If everything is setup correctly
you will see log messages in GameLiftLocal acknowledging the established connection. A successful call to processReady() means the integration is correct and a GameLift fleet can now be created.

To more thoroughly test the game server, you can use the AWS CLI. Note that the endpoint URL is overwritten to point to localhost, which is where the  GameLiftLocal server is running.

Create game session on the process:
```sh
aws gamelift create-game-session --endpoint-url http://localhost:8080 --maximum-player-session-count 2 --fleet-id fleet-123 --game-session-id gsess-abc
```

Describe game session to see if it went ACTIVE:
```sh
aws gamelift describe-game-sessions --endpoint-url http://localhost:8080 --game-session-id gsess-abc
```

Once game session is ACTIVE a player session can be created:
```sh
aws gamelift create-player-session --endpoint-url http://localhost:8080 --game-session-id gsess-abc --player-id Esteban
```

Finally, player session can be described:
```
aws gamelift describe-player-sessions --endpoint-url http://localhost:8080 --game-session-id gsess-abc
```
