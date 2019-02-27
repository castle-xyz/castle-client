#!/usr/bin/env bash

# Run this outside of Docker

cp ../../../ghost-secret/filebeat.yml gamelift-upload/filebeat.yml

cp ../build/castle-server gamelift-upload/
rm -rf gamelift-upload/base
cp -r ../build/base gamelift-upload/

oldversion=`cat gamelift-upload/version.txt`
newversion=`expr $oldversion + 1`
sed -i '' "s/$oldversion\$/$newversion/g" gamelift-upload/version.txt

echo "Uploading build $newversion..."
uploadOutput=`aws gamelift upload-build --operating-system AMAZON_LINUX --build-root gamelift-upload --name "castle" --build-version $newversion --region us-west-2`
buildId=$(echo $uploadOutput | sed 's/.*Build ID: \([a-zA-Z0-9_-]*\).*/\1/')

echo "Build ID: $buildId"
echo "Waiting for build to be ready..."
buildStatus=""
while [[ ${buildStatus} != *"\"READY\""* ]]
do
buildStatus=`aws gamelift describe-build --build-id $buildId --region us-west-2`
done

echo "Creating fleet..."
# TODO: add metric groups
fleetId=`aws gamelift create-fleet --name "castle-build-$newversion" --description "Castle fleet for version $newversion" --ec2-instance-type "c4.large" --fleet-type "ON_DEMAND" --build-id "$buildId" --runtime-configuration "GameSessionActivationTimeoutSeconds=1, MaxConcurrentGameSessionActivations=1, ServerProcesses=[{LaunchPath=/local/game/castle-server, ConcurrentExecutions=10}]" --new-game-session-protection-policy "FullProtection" --resource-creation-limit-policy "NewGameSessionsPerCreator=1, PolicyPeriodInMinutes=15" --ec2-inbound-permissions "FromPort=22122,ToPort=42122,IpRange=0.0.0.0/0,Protocol=UDP" --query 'FleetAttributes.FleetId' --output text`

echo "Created fleet with ID: $fleetId"

aws gamelift update-fleet-capacity --fleet-id $fleetId --max-size 5 --min-size 1 --desired-instances 1
aws gamelift put-scaling-policy --fleet-id $fleetId --name "CastleScalingPolicy-$newversion" --metric-name "IdleInstances" --comparison-operator "LessThanThreshold" --threshold "1.0" --scaling-adjustment-type "ChangeInCapacity" --scaling-adjustment "1" --evaluation-periods "1"

echo "Updated scaling policy"

# Example create fleet output:
# { "FleetAttributes": { "Status": "NEW", "FleetArn": "arn:aws:gamelift:us-west-2:998612243504:fleet/fleet-bdf11d20-4749-47ed-a8ca-337e18525d3b", "Name": "castle-build-30", "NewGameSessionProtectionPolicy": "FullProtection", "BuildId": "build-c1c67f47-b7fc-487e-b3fb-a760c2fa8f84", "CreationTime": 1543874169.192, "MetricGroups": [ "default" ], "InstanceType": "c4.large", "ServerLaunchPath": "/local/game/castle-server", "FleetId": "fleet-bdf11d20-4749-47ed-a8ca-337e18525d3b", "OperatingSystem": "AMAZON_LINUX", "ResourceCreationLimitPolicy": { "NewGameSessionsPerCreator": 1, "PolicyPeriodInMinutes": 15 }, "FleetType": "ON_DEMAND", "Description": "Castle fleet for version 30" } }