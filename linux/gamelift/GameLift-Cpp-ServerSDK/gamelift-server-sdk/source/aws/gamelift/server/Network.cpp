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
#include <aws/gamelift/internal/network/Network.h>
#include <aws/gamelift/internal/modelmapper/BackfillMatchmakingRequestMapper.h>
#include <google/protobuf/util/json_util.h>
#include <ctime>
#include <functional>

#define LOCALHOST "http://127.0.0.1:5757"
#define MAIN_PID "MAIN_PID"

#ifdef WIN32
#define BIND_EVENT(IO,EV,FN) \
    do{ \
        sio::socket::event_listener_aux l = FN; \
        IO->on(EV, l); \
        } while (0)

#else
#define BIND_EVENT(IO,EV,FN) \
    IO->on(EV, FN)
#include <unistd.h>
#endif

using namespace Aws::GameLift::Server::Model;
using namespace Aws::GameLift::Internal::Network;

static const char* pid = "pID";
static const char* sdkVersion = "sdkVersion";
static const char* sdkFlavorKey = "sdkLanguage";
static const char* sdkFlavor = "Cpp";

google::protobuf::util::JsonParseOptions m_parse_options = google::protobuf::util::JsonParseOptions();

Network::Network(sio::client* sioClientToAuxProxy, sio::client* sioClientFromAuxProxy,
                 AuxProxyMessageHandler* handler, AuxProxyMessageSender* sender)
: m_sio_client_to_aux_proxy(sioClientToAuxProxy)
, m_sio_client_from_aux_proxy(sioClientFromAuxProxy)
, m_handler(handler)
, m_sender(sender)
, m_connect_finish(false)
{
    m_parse_options.ignore_unknown_fields = true;

    ConfigureClient(m_sio_client_to_aux_proxy);
    ConfigureClient(m_sio_client_from_aux_proxy);
    
    std::map<std::string, std::string> map;
#ifdef GAMELIFT_USE_STD
    map[sdkVersion] = Aws::GameLift::Server::GetSdkVersion().GetResult().c_str();
#else
    map[sdkVersion] = Aws::GameLift::Server::GetSdkVersion().GetResult();
#endif

#ifdef WIN32
    map[pid] = std::to_string(::GetCurrentProcessId());
#else
    char* ppid = getenv(MAIN_PID);
    if (ppid){
        map[pid] = ppid;
    }
    else {
        map[pid] = std::to_string(::getpid());
    }
#endif
    map[sdkFlavorKey] = sdkFlavor;
    PerformConnect(m_sio_client_to_aux_proxy, map);
    PerformConnect(m_sio_client_from_aux_proxy, map);
}

Network::~Network()
{
    m_sio_client_to_aux_proxy->close();
    m_sio_client_from_aux_proxy->close();
    m_sio_client_to_aux_proxy = nullptr;
    m_sio_client_from_aux_proxy = nullptr;
    m_handler = nullptr;
    m_sender = nullptr;
}

void Network::ConfigureClient(sio::client* sioClient)
{
    sioClient->set_open_listener(std::bind(&Network::OnConnected, this));
    sioClient->set_fail_listener(std::bind(&Network::OnFail, this));
    sioClient->set_close_listener(std::bind(&Network::OnClose, this, std::placeholders::_1));
    sioClient->set_reconnect_attempts(3);

    SetupClientHandlers(sioClient);
}

void Network::PerformConnect(sio::client* sioClient, std::map<std::string, std::string> query)
{
    sioClient->connect(LOCALHOST, query);

    //Connecting synchronously.
    m_lock.lock();
    while (!m_connect_finish)
    {
        m_cond.wait(m_lock);
    }
    m_connect_finish = false;
    m_lock.unlock();
}

void Network::OnConnected()
{
    m_lock.lock();
    m_cond.notify_all();
    m_connect_finish = true;

    m_lock.unlock();
}

void Network::SetupClientHandlers(sio::client* sioClient)
{
    using std::placeholders::_1;
    using std::placeholders::_2;
    using std::placeholders::_3;
    using std::placeholders::_4;
    BIND_EVENT(sioClient->socket(), "StartGameSession", std::bind(&Network::OnStartGameSession, this, _1, _2, _3, _4));
    BIND_EVENT(sioClient->socket(), "UpdateGameSession", std::bind(&Network::OnUpdateGameSession, this, _1, _2, _3, _4));
    BIND_EVENT(sioClient->socket(), "TerminateProcess", std::bind(&Network::OnTerminateProcess, this, _1, _2, _3, _4));
}

void Network::OnFail()
{
    m_sio_client_to_aux_proxy->socket()->off_all();
    m_sio_client_from_aux_proxy->socket()->off_all();
}

void Network::OnClose(sio::client::close_reason const& reason)
{
    m_sio_client_to_aux_proxy->socket()->off_all();
    m_sio_client_from_aux_proxy->socket()->off_all();
}

void Network::OnStartGameSession(std::string const& name, sio::message::ptr const& data, bool hasAck, sio::message::list &ack_resp)
{
    //Expecting a buffered GameSession
    com::amazon::whitewater::auxproxy::pbuffer::ActivateGameSession activateGameSessionEvent;
    if(!google::protobuf::util::JsonStringToMessage(data->get_string(), &activateGameSessionEvent, m_parse_options).ok())
    {
        return;
    }

    GameSession gameSession = ParseFromBufferedGameSession(activateGameSessionEvent.gamesession());
    //Call the handler
    m_handler->OnStartGameSession(gameSession, ack_resp);
}

void Network::OnTerminateProcess(std::string const& name, sio::message::ptr const& data, bool hasAck, sio::message::list &ack_resp)
{
    com::amazon::whitewater::auxproxy::pbuffer::TerminateProcess terminateProcessEvent;
    if (!google::protobuf::util::JsonStringToMessage(data->get_string(), &terminateProcessEvent, m_parse_options).ok())
    {
        long currentTime = (long)time(0);
        //If terminationtime is empty send current time plus 5 minutes
        long defaultTerminationTime = currentTime + 270;
        m_handler->OnTerminateProcess(defaultTerminationTime);
        return;
    }
    long terminationTime = terminateProcessEvent.terminationtime();

    m_handler->OnTerminateProcess(terminationTime);
}

void Network::OnUpdateGameSession(std::string const& name, sio::message::ptr const& data, bool hasAck, sio::message::list &ack_resp)
{
    com::amazon::whitewater::auxproxy::pbuffer::UpdateGameSession updateGameSession;
    if (google::protobuf::util::JsonStringToMessage(data->get_string(), &updateGameSession, m_parse_options).ok())
    {
        UpdateGameSession gameSession = ParseFromBufferedUpdateGameSession(updateGameSession);
        m_handler->OnUpdateGameSession(gameSession, ack_resp);
    }
}

#ifdef GAMELIFT_USE_STD
Aws::GameLift::Server::Model::GameSession Network::ParseFromBufferedGameSession(
    const com::amazon::whitewater::auxproxy::pbuffer::GameSession& bGameSession)
{
    GameSession gameSession;
    gameSession.SetFleetId(bGameSession.fleetid().c_str());
    gameSession.SetGameSessionId(bGameSession.gamesessionid().c_str());
    gameSession.SetMaximumPlayerSessionCount(bGameSession.maxplayers());
    gameSession.SetName(bGameSession.name().c_str());
    gameSession.SetPort(bGameSession.port());
    gameSession.SetIpAddress(bGameSession.ipaddress().c_str());
    gameSession.SetGameSessionData(bGameSession.gamesessiondata().c_str());
    gameSession.SetMatchmakerData(bGameSession.matchmakerdata().c_str());
    gameSession.SetDnsName(bGameSession.dnsname().c_str());

    std::vector<GameProperty> gameProperties;
    for (int i = 0; i < bGameSession.gameproperties_size(); i++)
    {
        GameProperty gameProperty;
        auto property = bGameSession.gameproperties(i);
        gameProperty.SetKey(property.key().c_str());
        gameProperty.SetValue(property.value().c_str());

        gameProperties.push_back(gameProperty);
    }

    gameSession.SetGameProperties(gameProperties);

    return gameSession;
}

Aws::GameLift::Server::Model::UpdateGameSession
Network::ParseFromBufferedUpdateGameSession(const com::amazon::whitewater::auxproxy::pbuffer::UpdateGameSession& bUpdateGameSession)
{
    Aws::GameLift::Server::Model::GameSession gameSession =
        ParseFromBufferedGameSession(bUpdateGameSession.gamesession());

	std::string bUpdateReason = bUpdateGameSession.updatereason();
    UpdateReason updateReason = Aws::GameLift::Server::Model::UpdateReasonMapper::GetUpdateReasonForName(
		bUpdateReason);

    return UpdateGameSession(gameSession, updateReason, bUpdateGameSession.backfillticketid());
}
#else
Aws::GameLift::Server::Model::GameSession Network::ParseFromBufferedGameSession(
    const com::amazon::whitewater::auxproxy::pbuffer::GameSession& bGameSession)
{
    GameSession gameSession;
    gameSession.SetFleetId(bGameSession.fleetid().c_str());
    gameSession.SetGameSessionId(bGameSession.gamesessionid().c_str());
    gameSession.SetMaximumPlayerSessionCount(bGameSession.maxplayers());
    gameSession.SetName(bGameSession.name().c_str());
    gameSession.SetPort(bGameSession.port());
    gameSession.SetIpAddress(bGameSession.ipaddress().c_str());
    gameSession.SetGameSessionData(bGameSession.gamesessiondata().c_str());
    gameSession.SetMatchmakerData(bGameSession.matchmakerdata().c_str());
    gameSession.SetDnsName(bGameSession.dnsname().c_str());

    for (int i = 0; i < bGameSession.gameproperties_size(); i++)
    {
        GameProperty gameProperty;
        auto property = bGameSession.gameproperties(i);
        gameProperty.SetKey(property.key().c_str());
        gameProperty.SetValue(property.value().c_str());

        gameSession.AddGameProperty(gameProperty);
    }

    return gameSession;
}

Aws::GameLift::Server::Model::UpdateGameSession Network::ParseFromBufferedUpdateGameSession(
    const com::amazon::whitewater::auxproxy::pbuffer::UpdateGameSession& bUpdateGameSession)
{
    Aws::GameLift::Server::Model::GameSession gameSession =
        ParseFromBufferedGameSession(bUpdateGameSession.gamesession());
    UpdateReason updateReason = Aws::GameLift::Server::Model::UpdateReasonMapper::GetUpdateReasonForName(
        bUpdateGameSession.updatereason().c_str());

    return UpdateGameSession(gameSession, updateReason, bUpdateGameSession.backfillticketid().c_str());
}
#endif
