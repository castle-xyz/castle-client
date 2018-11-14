/*
* All or portions of this file Copyright (c) Amazon.com, Inc. or its affiliates or
* its licensors.
*
* For complete copyright and license terms please see the LICENSE at the root of this
* distribution (the "License"). All use of this software is governed by the License,
* or, if provided, by the license below or the license accompanying this file. Do not
* remove or modify any license notices. This file is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*
*/
#include <aws/gamelift/server/GameLiftServerAPI.h>
#include <aws/gamelift/server/ProcessParameters.h>
#include <aws/gamelift/internal/GameLiftServerState.h>

using namespace Aws::GameLift;

static const std::string sdkVersion = "3.2.1";

#ifdef GAMELIFT_USE_STD
Aws::GameLift::AwsStringOutcome Server::GetSdkVersion()
{
	return AwsStringOutcome(sdkVersion);
}

Server::InitSDKOutcome Server::InitSDK()
{
    InitSDKOutcome initOutcome = InitSDKOutcome(Internal::GameLiftServerState::CreateInstance());
    if (initOutcome.IsSuccess())
    {
        GenericOutcome networkingOutcome = initOutcome.GetResult()->InitializeNetworking();
        if (!networkingOutcome.IsSuccess()) {
            return InitSDKOutcome(networkingOutcome.GetError());
        }
    }
    return initOutcome;
}

Server::InitSDKOutcome Server::InitSDKWithExisting(Internal::GameLiftServerState* existingState)
{
    GenericOutcome outcome = Internal::GameLiftCommonState::SetInstance(existingState);
    if (outcome.IsSuccess())
    {
        return InitSDKOutcome(existingState);
    }
    else
    {
        return InitSDKOutcome(outcome.GetError());
    }
}

GenericOutcome Server::ProcessReady(const Aws::GameLift::Server::ProcessParameters &processParameters)
{
    Internal::GetInstanceOutcome giOutcome =
    Internal::GameLiftCommonState::GetInstance(Internal::GAMELIFT_INTERNAL_STATE_TYPE::SERVER);

    if (!giOutcome.IsSuccess())
    {
        return GenericOutcome(giOutcome.GetError());
    }

    Internal::GameLiftServerState* serverState = static_cast<Internal::GameLiftServerState*>(giOutcome.GetResult());
    return serverState->ProcessReady(processParameters);
}

GenericOutcomeCallable Server::ProcessReadyAsync(const Aws::GameLift::Server::ProcessParameters &processParameters)
{
    GenericOutcome(*ProcessReady)(const Aws::GameLift::Server::ProcessParameters&) = &Server::ProcessReady;

    return std::async(std::launch::async, ProcessReady, processParameters);
}

GenericOutcome Server::ProcessEnding()
{
    Internal::GetInstanceOutcome giOutcome =
        Internal::GameLiftCommonState::GetInstance(Internal::GAMELIFT_INTERNAL_STATE_TYPE::SERVER);

    if (!giOutcome.IsSuccess())
    {
        return GenericOutcome(giOutcome.GetError());
    }

    Internal::GameLiftServerState* serverState = static_cast<Internal::GameLiftServerState*>(giOutcome.GetResult());
    return serverState->ProcessEnding();
}

GenericOutcome Server::ActivateGameSession()
{
    Internal::GetInstanceOutcome giOutcome =
        Internal::GameLiftCommonState::GetInstance(Internal::GAMELIFT_INTERNAL_STATE_TYPE::SERVER);

    if (!giOutcome.IsSuccess())
    {
        return GenericOutcome(giOutcome.GetError());
    }

    Internal::GameLiftServerState* serverState = static_cast<Internal::GameLiftServerState*>(giOutcome.GetResult());

    return serverState->ActivateGameSession();
}

GenericOutcome Server::TerminateGameSession()
{
    Internal::GetInstanceOutcome giOutcome =
        Internal::GameLiftCommonState::GetInstance(Internal::GAMELIFT_INTERNAL_STATE_TYPE::SERVER);

    if (!giOutcome.IsSuccess())
    {
        return GenericOutcome(giOutcome.GetError());
    }

    Internal::GameLiftServerState* serverState = static_cast<Internal::GameLiftServerState*>(giOutcome.GetResult());

    return serverState->TerminateGameSession();
}

StartMatchBackfillOutcome Server::StartMatchBackfill(const Aws::GameLift::Server::Model::StartMatchBackfillRequest &request)
{
    Internal::GetInstanceOutcome giOutcome =
        Internal::GameLiftCommonState::GetInstance(Internal::GAMELIFT_INTERNAL_STATE_TYPE::SERVER);

    if (!giOutcome.IsSuccess())
    {
        return StartMatchBackfillOutcome(giOutcome.GetError());
    }

    Internal::GameLiftServerState* serverState = static_cast<Internal::GameLiftServerState*>(giOutcome.GetResult());
    return serverState->BackfillMatchmaking(request);
}

GenericOutcome Server::StopMatchBackfill(const Aws::GameLift::Server::Model::StopMatchBackfillRequest &request)
{
    Internal::GetInstanceOutcome giOutcome =
        Internal::GameLiftCommonState::GetInstance(Internal::GAMELIFT_INTERNAL_STATE_TYPE::SERVER);

    if (!giOutcome.IsSuccess())
    {
        return GenericOutcome(giOutcome.GetError());
    }

    Internal::GameLiftServerState* serverState = static_cast<Internal::GameLiftServerState*>(giOutcome.GetResult());
    return serverState->StopMatchmaking(request);
}

GenericOutcome Server::UpdatePlayerSessionCreationPolicy(Aws::GameLift::Server::Model::PlayerSessionCreationPolicy newPlayerSessionPolicy)
{
    Internal::GetInstanceOutcome giOutcome =
    Internal::GameLiftCommonState::GetInstance(Internal::GAMELIFT_INTERNAL_STATE_TYPE::SERVER);

    if (!giOutcome.IsSuccess())
    {
        return GenericOutcome(giOutcome.GetError());
    }

    Internal::GameLiftServerState* serverState = static_cast<Internal::GameLiftServerState*>(giOutcome.GetResult());

    return serverState->UpdatePlayerSessionCreationPolicy(newPlayerSessionPolicy);
}

Aws::GameLift::AwsStringOutcome Server::GetGameSessionId()
{
    Internal::GetInstanceOutcome giOutcome =
        Internal::GameLiftCommonState::GetInstance(Internal::GAMELIFT_INTERNAL_STATE_TYPE::SERVER);

    if (!giOutcome.IsSuccess())
    {
        return AwsStringOutcome(giOutcome.GetError());
    }

    Internal::GameLiftServerState* serverState = static_cast<Internal::GameLiftServerState*>(giOutcome.GetResult());

    if (!serverState->IsProcessReady())
    {
        return AwsStringOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::PROCESS_NOT_READY));
    }

    return AwsStringOutcome(serverState->GetGameSessionId());
}

Aws::GameLift::AwsLongOutcome Server::GetTerminationTime()
{
	Internal::GetInstanceOutcome giOutcome =
		Internal::GameLiftCommonState::GetInstance(Internal::GAMELIFT_INTERNAL_STATE_TYPE::SERVER);

	if (!giOutcome.IsSuccess())
	{
		return AwsLongOutcome(giOutcome.GetError());
	}

	Internal::GameLiftServerState* serverState = static_cast<Internal::GameLiftServerState*>(giOutcome.GetResult());

	return AwsLongOutcome(serverState->GetTerminationTime());
}

GenericOutcome Server::AcceptPlayerSession(const std::string& playerSessionId)
{
    Internal::GetInstanceOutcome giOutcome =
        Internal::GameLiftCommonState::GetInstance(Internal::GAMELIFT_INTERNAL_STATE_TYPE::SERVER);

    if (!giOutcome.IsSuccess())
    {
        return GenericOutcome(giOutcome.GetError());
    }

    Internal::GameLiftServerState* serverState = static_cast<Internal::GameLiftServerState*>(giOutcome.GetResult());

    if (!serverState->IsProcessReady())
    {
        return GenericOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::PROCESS_NOT_READY));
    }

    return serverState->AcceptPlayerSession(playerSessionId);
}

GenericOutcome Server::RemovePlayerSession(const std::string& playerSessionId)
{
    Internal::GetInstanceOutcome giOutcome =
        Internal::GameLiftCommonState::GetInstance(Internal::GAMELIFT_INTERNAL_STATE_TYPE::SERVER);

    if (!giOutcome.IsSuccess())
    {
        return GenericOutcome(giOutcome.GetError());
    }

    Internal::GameLiftServerState* serverState = static_cast<Internal::GameLiftServerState*>(giOutcome.GetResult());

    if (!serverState->IsProcessReady())
    {
        return GenericOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::PROCESS_NOT_READY));
    }

    return serverState->RemovePlayerSession(playerSessionId);
}

#else
Aws::GameLift::AwsStringOutcome Server::GetSdkVersion()
{
    return AwsStringOutcome(sdkVersion.c_str());
}

GenericOutcome Server::InitSDK()
{
    Internal::InitSDKOutcome initOutcome = Internal::InitSDKOutcome(Internal::GameLiftServerState::CreateInstance());
    if (initOutcome.IsSuccess())
    {
        GenericOutcome networkingOutcome = initOutcome.GetResult()->InitializeNetworking();
        if (!networkingOutcome.IsSuccess()) {
            return GenericOutcome(networkingOutcome.GetError());
        }
    }
    return GenericOutcome(nullptr);
}

GenericOutcome Server::ProcessReady(const Aws::GameLift::Server::ProcessParameters &processParameters)
{
    Internal::GetInstanceOutcome giOutcome =
        Internal::GameLiftCommonState::GetInstance(Internal::GAMELIFT_INTERNAL_STATE_TYPE::SERVER);

    if (!giOutcome.IsSuccess())
    {
        return GenericOutcome(giOutcome.GetError());
    }

    Internal::GameLiftServerState* serverState = static_cast<Internal::GameLiftServerState*>(giOutcome.GetResult());
    return serverState->ProcessReady(processParameters);
}

GenericOutcome Server::ProcessEnding()
{
    Internal::GetInstanceOutcome giOutcome =
        Internal::GameLiftCommonState::GetInstance(Internal::GAMELIFT_INTERNAL_STATE_TYPE::SERVER);

    if (!giOutcome.IsSuccess())
    {
        return GenericOutcome(giOutcome.GetError());
    }

    Internal::GameLiftServerState* serverState = static_cast<Internal::GameLiftServerState*>(giOutcome.GetResult());
    return serverState->ProcessEnding();
}

GenericOutcome Server::ActivateGameSession()
{
    Internal::GetInstanceOutcome giOutcome =
        Internal::GameLiftCommonState::GetInstance(Internal::GAMELIFT_INTERNAL_STATE_TYPE::SERVER);

    if (!giOutcome.IsSuccess())
    {
        return GenericOutcome(giOutcome.GetError());
    }

    Internal::GameLiftServerState* serverState = static_cast<Internal::GameLiftServerState*>(giOutcome.GetResult());

    return serverState->ActivateGameSession();
}

GenericOutcome Server::TerminateGameSession()
{
    Internal::GetInstanceOutcome giOutcome =
        Internal::GameLiftCommonState::GetInstance(Internal::GAMELIFT_INTERNAL_STATE_TYPE::SERVER);

    if (!giOutcome.IsSuccess())
    {
        return GenericOutcome(giOutcome.GetError());
    }

    Internal::GameLiftServerState* serverState = static_cast<Internal::GameLiftServerState*>(giOutcome.GetResult());

    return serverState->TerminateGameSession();
}

StartMatchBackfillOutcome Server::StartMatchBackfill(const Aws::GameLift::Server::Model::StartMatchBackfillRequest &request)
{
    Internal::GetInstanceOutcome giOutcome =
        Internal::GameLiftCommonState::GetInstance(Internal::GAMELIFT_INTERNAL_STATE_TYPE::SERVER);

    if (!giOutcome.IsSuccess())
    {
        return StartMatchBackfillOutcome(giOutcome.GetError());
    }

    Internal::GameLiftServerState* serverState = static_cast<Internal::GameLiftServerState*>(giOutcome.GetResult());
    return serverState->BackfillMatchmaking(request);
}

GenericOutcome Server::StopMatchBackfill(const Aws::GameLift::Server::Model::StopMatchBackfillRequest &request)
{
    Internal::GetInstanceOutcome giOutcome =
        Internal::GameLiftCommonState::GetInstance(Internal::GAMELIFT_INTERNAL_STATE_TYPE::SERVER);

    if (!giOutcome.IsSuccess())
    {
        return GenericOutcome(giOutcome.GetError());
    }

    Internal::GameLiftServerState* serverState = static_cast<Internal::GameLiftServerState*>(giOutcome.GetResult());
    return serverState->StopMatchmaking(request);
}

GenericOutcome Server::UpdatePlayerSessionCreationPolicy(Aws::GameLift::Server::Model::PlayerSessionCreationPolicy newPlayerSessionPolicy)
{
    Internal::GetInstanceOutcome giOutcome =
        Internal::GameLiftCommonState::GetInstance(Internal::GAMELIFT_INTERNAL_STATE_TYPE::SERVER);

    if (!giOutcome.IsSuccess())
    {
        return GenericOutcome(giOutcome.GetError());
    }

    Internal::GameLiftServerState* serverState = static_cast<Internal::GameLiftServerState*>(giOutcome.GetResult());

    return serverState->UpdatePlayerSessionCreationPolicy(newPlayerSessionPolicy);
}

Aws::GameLift::AwsStringOutcome Server::GetGameSessionId()
{
    Internal::GetInstanceOutcome giOutcome =
        Internal::GameLiftCommonState::GetInstance(Internal::GAMELIFT_INTERNAL_STATE_TYPE::SERVER);

    if (!giOutcome.IsSuccess())
    {
        return AwsStringOutcome(giOutcome.GetError());
    }

    Internal::GameLiftServerState* serverState = static_cast<Internal::GameLiftServerState*>(giOutcome.GetResult());

    if (!serverState->IsProcessReady())
    {
        return AwsStringOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::PROCESS_NOT_READY));
    }

    return AwsStringOutcome(serverState->GetGameSessionId().c_str());
}

Aws::GameLift::AwsLongOutcome Server::GetTerminationTime()
{
	Internal::GetInstanceOutcome giOutcome =
		Internal::GameLiftCommonState::GetInstance(Internal::GAMELIFT_INTERNAL_STATE_TYPE::SERVER);

	if (!giOutcome.IsSuccess())
	{
		return AwsLongOutcome(giOutcome.GetError());
	}

	Internal::GameLiftServerState* serverState = static_cast<Internal::GameLiftServerState*>(giOutcome.GetResult());

	return AwsLongOutcome(serverState->GetTerminationTime());
}

GenericOutcome Server::AcceptPlayerSession(const char* playerSessionId)
{
    Internal::GetInstanceOutcome giOutcome =
        Internal::GameLiftCommonState::GetInstance(Internal::GAMELIFT_INTERNAL_STATE_TYPE::SERVER);

    if (!giOutcome.IsSuccess())
    {
        return GenericOutcome(giOutcome.GetError());
    }

    Internal::GameLiftServerState* serverState = static_cast<Internal::GameLiftServerState*>(giOutcome.GetResult());

    if (!serverState->IsProcessReady())
    {
        return GenericOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::PROCESS_NOT_READY));
    }

    return serverState->AcceptPlayerSession(playerSessionId);
}

GenericOutcome Server::RemovePlayerSession(const char* playerSessionId)
{
    Internal::GetInstanceOutcome giOutcome =
        Internal::GameLiftCommonState::GetInstance(Internal::GAMELIFT_INTERNAL_STATE_TYPE::SERVER);

    if (!giOutcome.IsSuccess())
    {
        return GenericOutcome(giOutcome.GetError());
    }

    Internal::GameLiftServerState* serverState = static_cast<Internal::GameLiftServerState*>(giOutcome.GetResult());

    if (!serverState->IsProcessReady())
    {
        return GenericOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::PROCESS_NOT_READY));
    }

    return serverState->RemovePlayerSession(playerSessionId);
}
#endif

DescribePlayerSessionsOutcome Server::DescribePlayerSessions(const Aws::GameLift::Server::Model::DescribePlayerSessionsRequest &describePlayerSessionsRequest)
{
    Internal::GetInstanceOutcome giOutcome =
        Internal::GameLiftCommonState::GetInstance(Internal::GAMELIFT_INTERNAL_STATE_TYPE::SERVER);

    if (!giOutcome.IsSuccess())
    {
        return DescribePlayerSessionsOutcome(giOutcome.GetError());
    }

    Internal::GameLiftServerState* serverState = static_cast<Internal::GameLiftServerState*>(giOutcome.GetResult());

    if (!serverState->IsProcessReady())
    {
        return DescribePlayerSessionsOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::PROCESS_NOT_READY));
    }

    return serverState->DescribePlayerSessions(describePlayerSessionsRequest);
}

GenericOutcome Server::Destroy()
{
    return Internal::GameLiftCommonState::DestroyInstance();
}
