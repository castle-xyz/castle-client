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
#include <aws/gamelift/internal/GameLiftServerState.h>
#include <aws/gamelift/server/ProcessParameters.h>
#include <aws/gamelift/server/protocols/sdk.pb.h>
#include <fstream>
#include <iostream>

using namespace Aws::GameLift;

#ifndef HEALTHCHECK_TIMEOUT_SECONDS
    #define HEALTHCHECK_TIMEOUT_SECONDS 60
#endif

#ifdef GAMELIFT_USE_STD
Internal::GameLiftServerState::GameLiftServerState()
	: m_onStartGameSession(nullptr)
	, m_onProcessTerminate(nullptr)
	, m_onHealthCheck(nullptr)
	, m_processReady(false)
	, m_network(nullptr)
	, m_terminationTime(-1)
{
}


Internal::GameLiftServerState::~GameLiftServerState()
{
    Internal::GameLiftCommonState::SetInstance(nullptr);
    m_onStartGameSession = nullptr;
    m_onUpdateGameSession = nullptr;
    m_onProcessTerminate = nullptr;
    m_onHealthCheck = nullptr;
    m_processReady = false;
    m_network = nullptr;
    m_terminationTime = -1;
}

GenericOutcome Internal::GameLiftServerState::ProcessReady(const Aws::GameLift::Server::ProcessParameters &processParameters)
{
    m_processReady = true;

    m_onStartGameSession = processParameters.getOnStartGameSession();
    m_onUpdateGameSession = processParameters.getOnUpdateGameSession();
    m_onProcessTerminate = processParameters.getOnProcessTerminate();

    if (processParameters.getOnHealthCheck() == nullptr)
    {
        m_onHealthCheck = std::bind(&Internal::GameLiftServerState::DefaultHealthCheck, this);
    }
    else
    {
        m_onHealthCheck = processParameters.getOnHealthCheck();
    }

    if (AssertNetworkInitialized())
    {
    return GenericOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::GAMELIFT_SERVER_NOT_INITIALIZED));
    }

    GenericOutcome result = m_network->getAuxProxySender()->ProcessReady(processParameters.getPort(), processParameters.getLogParameters());

    std::thread healthCheck(std::bind(&Internal::GameLiftServerState::HealthCheck, this));
    healthCheck.detach();

    return result;
}

void Internal::GameLiftServerState::HealthCheck()
{
    while (m_processReady)
    {
        std::async(std::launch::async, &Internal::GameLiftServerState::ReportHealth, this);
        std::this_thread::sleep_for(std::chrono::seconds(HEALTHCHECK_TIMEOUT_SECONDS));
    }
}

void Internal::GameLiftServerState::ReportHealth()
{
    std::future<bool> future = std::async(std::launch::async, m_onHealthCheck);

    std::chrono::system_clock::time_point timeoutSeconds = std::chrono::system_clock::now() + std::chrono::seconds(HEALTHCHECK_TIMEOUT_SECONDS);

    // wait_until blocks until timeoutSeconds has been reached or the result becomes available
    if (std::future_status::ready == future.wait_until(timeoutSeconds))
    {
        m_network->getAuxProxySender()->ReportHealth(future.get());
    }
    else
    {
        m_network->getAuxProxySender()->ReportHealth(false);
    }
}

::GenericOutcome Internal::GameLiftServerState::ProcessEnding()
{
    m_processReady = false;

    if (AssertNetworkInitialized())
    {
        return GenericOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::GAMELIFT_SERVER_NOT_INITIALIZED));
    }
    m_network->getAuxProxySender()->ProcessEnding();
    return GenericOutcome(nullptr);
}


std::string Internal::GameLiftServerState::GetGameSessionId()
{
    return m_gameSessionId;
}

long Internal::GameLiftServerState::GetTerminationTime()
{
	return m_terminationTime;
}

GenericOutcome Internal::GameLiftServerState::ActivateGameSession()
{
    if (!m_processReady)
    {
        return GenericOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::PROCESS_NOT_READY));
    }

    if (AssertNetworkInitialized())
    {
        return GenericOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::GAMELIFT_SERVER_NOT_INITIALIZED));
    }
    m_network->getAuxProxySender()->ActivateGameSession(m_gameSessionId);
    return GenericOutcome(nullptr);
}


GenericOutcome Internal::GameLiftServerState::TerminateGameSession()
{
    if (AssertNetworkInitialized())
    {
        return GenericOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::GAMELIFT_SERVER_NOT_INITIALIZED));
    }
    m_network->getAuxProxySender()->TerminateGameSession(m_gameSessionId);
    return GenericOutcome(nullptr);
}

GenericOutcome Internal::GameLiftServerState::UpdatePlayerSessionCreationPolicy(Aws::GameLift::Server::Model::PlayerSessionCreationPolicy newPlayerSessionPolicy)
{
    std::string newPlayerSessionPolicyInString = Aws::GameLift::Server::Model::PlayerSessionCreationPolicyMapper::GetNameForPlayerSessionCreationPolicy(newPlayerSessionPolicy);

    if (AssertNetworkInitialized())
    {
        return GenericOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::GAMELIFT_SERVER_NOT_INITIALIZED));
    }
    m_network->getAuxProxySender()->UpdatePlayerSessionCreationPolicy(m_gameSessionId.c_str(), newPlayerSessionPolicyInString.c_str());
    return GenericOutcome(nullptr);
}

Server::InitSDKOutcome
Internal::GameLiftServerState::CreateInstance()
{
    if (GameLiftCommonState::GetInstance().IsSuccess())
    {
        return Server::InitSDKOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::ALREADY_INITIALIZED));
    }
    GameLiftServerState* newState = new GameLiftServerState;
    GenericOutcome setOutcome = GameLiftCommonState::SetInstance(newState);
    if (!setOutcome.IsSuccess())
    {
        delete newState;
        return Server::InitSDKOutcome(setOutcome.GetError());
    }
    return newState;
}


GenericOutcome Internal::GameLiftServerState::AcceptPlayerSession(const std::string& playerSessionId)
{
    if (AssertNetworkInitialized())
    {
        return GenericOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::GAMELIFT_SERVER_NOT_INITIALIZED));
    }
    return m_network->getAuxProxySender()->AcceptPlayerSession(playerSessionId, m_gameSessionId);
}


GenericOutcome Internal::GameLiftServerState::RemovePlayerSession(const std::string& playerSessionId)
{
    if (AssertNetworkInitialized())
    {
        return GenericOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::GAMELIFT_SERVER_NOT_INITIALIZED));
    }
    return m_network->getAuxProxySender()->RemovePlayerSession(playerSessionId, m_gameSessionId);
}


void Internal::GameLiftServerState::OnStartGameSession(Aws::GameLift::Server::Model::GameSession& gameSession, sio::message::list& ack_resp)
{
    std::string gameSessionId = gameSession.GetGameSessionId();
    if (!m_processReady)
    {
        ack_resp.insert(0, sio::bool_message::create(false));
        return;
    }

    m_gameSessionId = gameSessionId;

    //Invoking OnStartGameSession callback specified by the developer.
    std::thread activateGameSession(std::bind(m_onStartGameSession, gameSession));
    activateGameSession.detach();
    ack_resp.insert(0, sio::bool_message::create(true));
}


void Internal::GameLiftServerState::OnTerminateProcess(long terminationTime)
{
    m_terminationTime = terminationTime;
	
    std::thread terminateProcess(std::bind(m_onProcessTerminate));
    terminateProcess.detach();
}


void Internal::GameLiftServerState::OnUpdateGameSession(Aws::GameLift::Server::Model::UpdateGameSession& updateGameSession, sio::message::list& ack_resp)
{
    if (!m_processReady)
    {
        ack_resp.insert(0, sio::bool_message::create(false));
        return;
    }

    //Invoking OnUpdateGameSession callback specified by the developer.
    std::thread updateGameSessionThread(std::bind(m_onUpdateGameSession, updateGameSession));
    updateGameSessionThread.detach();
    ack_resp.insert(0, sio::bool_message::create(true));
}


bool Internal::GameLiftServerState::AssertNetworkInitialized()
{
    return !m_network || !m_network->getAuxProxySender();
}

#else

Internal::GameLiftServerState::GameLiftServerState()
	: m_onStartGameSession(nullptr)
	, m_onProcessTerminate(nullptr)
	, m_onHealthCheck(nullptr)
	, m_processReady(false)
	, m_network(nullptr)
	, m_terminationTime(-1)

{
}


Internal::GameLiftServerState::~GameLiftServerState()
{
    Internal::GameLiftCommonState::SetInstance(nullptr);
    m_onStartGameSession = nullptr;
    m_onProcessTerminate = nullptr;
    m_onHealthCheck = nullptr;
    m_startGameSessionState = nullptr;
    m_updateGameSessionState = nullptr;
    m_processTerminateState = nullptr;
    m_healthCheckState = nullptr;
    m_processReady = false;
    m_network = nullptr;
    m_terminationTime = -1;
}

GenericOutcome Internal::GameLiftServerState::ProcessReady(const Aws::GameLift::Server::ProcessParameters &processParameters)
{
    m_processReady = true;

    m_onStartGameSession = processParameters.getOnStartGameSession();
    m_startGameSessionState = processParameters.getStartGameSessionState();
    m_onUpdateGameSession = processParameters.getOnUpdateGameSession();
    m_updateGameSessionState = processParameters.getUpdateGameSessionState();
    m_onProcessTerminate = processParameters.getOnProcessTerminate();
    m_processTerminateState = processParameters.getProcessTerminateState();

    if (processParameters.getOnHealthCheck() == nullptr)
    {
        m_onHealthCheck = std::bind(&Internal::GameLiftServerState::DefaultHealthCheck, this);
    }
    else
    {
        m_onHealthCheck = processParameters.getOnHealthCheck();
        m_healthCheckState = processParameters.getHealthCheckState();
    }

    if (AssertNetworkInitialized())
    {
        return GenericOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::GAMELIFT_SERVER_NOT_INITIALIZED));
    }

    GenericOutcome result = m_network->getAuxProxySender()->ProcessReady(processParameters.getPort(), processParameters.getLogParameters());

    std::thread healthCheck(std::bind(&Internal::GameLiftServerState::HealthCheck, this));
    healthCheck.detach();

    return result;
}

void Internal::GameLiftServerState::HealthCheck()
{
    while (m_processReady)
    {
        std::async(std::launch::async, &Internal::GameLiftServerState::ReportHealth, this);
        std::this_thread::sleep_for(std::chrono::seconds(HEALTHCHECK_TIMEOUT_SECONDS));
    }
}

void Internal::GameLiftServerState::ReportHealth()
{
    std::future<bool> future = std::async(std::launch::async, m_onHealthCheck, m_healthCheckState);

    std::chrono::system_clock::time_point timeoutSeconds = std::chrono::system_clock::now() + std::chrono::seconds(HEALTHCHECK_TIMEOUT_SECONDS);

    // wait_until blocks until timeoutSeconds has been reached or the result becomes available
    if (std::future_status::ready == future.wait_until(timeoutSeconds))
    {
        m_network->getAuxProxySender()->ReportHealth(future.get());
    }
    else
    {
        m_network->getAuxProxySender()->ReportHealth(false);
    }
}

::GenericOutcome Internal::GameLiftServerState::ProcessEnding()
{
    m_processReady = false;

    if (AssertNetworkInitialized())
    {
        return GenericOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::GAMELIFT_SERVER_NOT_INITIALIZED));
    }
    m_network->getAuxProxySender()->ProcessEnding();
    return GenericOutcome(nullptr);
}


std::string Internal::GameLiftServerState::GetGameSessionId()
{
    return m_gameSessionId;
}

long Internal::GameLiftServerState::GetTerminationTime()
{
    return m_terminationTime;
}

GenericOutcome Internal::GameLiftServerState::ActivateGameSession()
{
    if (!m_processReady)
    {
        return GenericOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::PROCESS_NOT_READY));
    }

    if (AssertNetworkInitialized())
    {
        return GenericOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::GAMELIFT_SERVER_NOT_INITIALIZED));
    }
    m_network->getAuxProxySender()->ActivateGameSession(m_gameSessionId);
    return GenericOutcome(nullptr);
}


GenericOutcome Internal::GameLiftServerState::TerminateGameSession()
{
    if (AssertNetworkInitialized())
    {
        return GenericOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::GAMELIFT_SERVER_NOT_INITIALIZED));
    }
    m_network->getAuxProxySender()->TerminateGameSession(m_gameSessionId);
    return GenericOutcome(nullptr);
}

GenericOutcome Internal::GameLiftServerState::UpdatePlayerSessionCreationPolicy(Aws::GameLift::Server::Model::PlayerSessionCreationPolicy newPlayerSessionPolicy)
{
    std::string newPlayerSessionPolicyInString = Aws::GameLift::Server::Model::PlayerSessionCreationPolicyMapper::GetNameForPlayerSessionCreationPolicy(newPlayerSessionPolicy);

    if (AssertNetworkInitialized())
    {
        return GenericOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::GAMELIFT_SERVER_NOT_INITIALIZED));
    }
    m_network->getAuxProxySender()->UpdatePlayerSessionCreationPolicy(m_gameSessionId.c_str(), newPlayerSessionPolicyInString.c_str());
    return GenericOutcome(nullptr);
}

Internal::InitSDKOutcome
Internal::GameLiftServerState::CreateInstance()
{
    if (GameLiftCommonState::GetInstance().IsSuccess())
    {
        return Internal::InitSDKOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::ALREADY_INITIALIZED));
    }
    GameLiftServerState* newState = new GameLiftServerState;
    GenericOutcome setOutcome = GameLiftCommonState::SetInstance(newState);
    if (!setOutcome.IsSuccess())
    {
        delete newState;
        return Outcome<GameLiftServerState*, GameLiftError>(setOutcome.GetError());
    }
    return newState;
}


GenericOutcome Internal::GameLiftServerState::AcceptPlayerSession(const std::string& playerSessionId)
{
    if (AssertNetworkInitialized())
    {
        return GenericOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::GAMELIFT_SERVER_NOT_INITIALIZED));
    }
    return m_network->getAuxProxySender()->AcceptPlayerSession(playerSessionId, m_gameSessionId);
}


GenericOutcome Internal::GameLiftServerState::RemovePlayerSession(const std::string& playerSessionId)
{
    if (AssertNetworkInitialized())
    {
        return GenericOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::GAMELIFT_SERVER_NOT_INITIALIZED));
    }
    return m_network->getAuxProxySender()->RemovePlayerSession(playerSessionId, m_gameSessionId);
}


void Internal::GameLiftServerState::OnStartGameSession(Aws::GameLift::Server::Model::GameSession& gameSession, sio::message::list& ack_resp)
{
    std::string gameSessionId = gameSession.GetGameSessionId();
    if (!m_processReady)
    {
        ack_resp.insert(0, sio::bool_message::create(false));
        return;
    }

    m_gameSessionId = gameSessionId;

    //Invoking OnStartGameSession callback specified by the developer.
    std::thread activateGameSession(std::bind(m_onStartGameSession, gameSession, m_startGameSessionState));
    activateGameSession.detach();
    ack_resp.insert(0, sio::bool_message::create(true));
}


void Internal::GameLiftServerState::OnUpdateGameSession(Aws::GameLift::Server::Model::UpdateGameSession& updateGameSession, sio::message::list& ack_resp)
{
    if (!m_processReady)
    {
        ack_resp.insert(0, sio::bool_message::create(false));
        return;
    }

    //Invoking OnUpdateGameSession callback specified by the developer.
    std::thread updateGameSessionThread(std::bind(m_onUpdateGameSession, updateGameSession, m_updateGameSessionState));
    updateGameSessionThread.detach();
    ack_resp.insert(0, sio::bool_message::create(true));
}


void Internal::GameLiftServerState::OnTerminateProcess(long terminationTime)
{
    m_terminationTime = terminationTime;

    //Invoking onProcessTerminate callback specified by the developer.
    std::thread terminateProcess(std::bind(m_onProcessTerminate, m_processTerminateState));
    terminateProcess.detach();
}


bool Internal::GameLiftServerState::AssertNetworkInitialized()
{
    return !m_network || !m_network->getAuxProxySender();
}
#endif

GenericOutcome Internal::GameLiftServerState::InitializeNetworking()
{
    using namespace Aws::GameLift::Internal;

    // Sdk <-> AuxProxy communication
    // We use two sockets because it was observed that a single one resulted in calls
    // inward from AuxProxy being held up by calls outward to AuxProxy.  The "ToAuxProxy"
    // socket is for calls originated by the SDK, and the "FromAuxProxy" is for those
    // originated by AuxProxy
    sio::client* sioClientToAuxProxy = new sio::client;
    sio::client* sioClientFromAuxProxy = new sio::client;
    Network::AuxProxyMessageSender* sender = new Network::AuxProxyMessageSender(sioClientToAuxProxy);
    m_network = new Network::Network(sioClientToAuxProxy, sioClientFromAuxProxy, this, sender);

    return GenericOutcome(nullptr);
}

DescribePlayerSessionsOutcome Internal::GameLiftServerState::DescribePlayerSessions(const Aws::GameLift::Server::Model::DescribePlayerSessionsRequest &describePlayerSessionsRequest)
{
    if (AssertNetworkInitialized())
    {
        return DescribePlayerSessionsOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::GAMELIFT_SERVER_NOT_INITIALIZED));
    }
    return m_network->getAuxProxySender()->DescribePlayerSessions(describePlayerSessionsRequest);
}

StartMatchBackfillOutcome Internal::GameLiftServerState::BackfillMatchmaking(
    const Aws::GameLift::Server::Model::StartMatchBackfillRequest &request)
{
    if (AssertNetworkInitialized())
    {
        return StartMatchBackfillOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::GAMELIFT_SERVER_NOT_INITIALIZED));
    }

    return m_network->getAuxProxySender()->BackfillMatchmaking(request);
}

GenericOutcome Internal::GameLiftServerState::StopMatchmaking(
    const Aws::GameLift::Server::Model::StopMatchBackfillRequest &request)
{
    if (AssertNetworkInitialized())
    {
        return GenericOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::GAMELIFT_SERVER_NOT_INITIALIZED));
    }

    return m_network->getAuxProxySender()->StopMatchmaking(request);
}
