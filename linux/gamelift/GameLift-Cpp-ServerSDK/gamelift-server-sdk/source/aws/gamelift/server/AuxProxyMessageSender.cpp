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
#include <aws/gamelift/internal/network/AuxProxyMessageSender.h>
#include <aws/gamelift/internal/modelmapper/DescribePlayerSessionsMapper.h>
#include <aws/gamelift/internal/modelmapper/BackfillMatchmakingRequestMapper.h>
#include <google/protobuf/util/json_util.h>
#include <future>

using namespace Aws::GameLift;
using namespace Aws::GameLift::Internal::Network;
using namespace Aws::GameLift::Internal::ModelMapper;
using namespace Aws::GameLift::Server::Model;
using namespace com::amazon::whitewater::auxproxy;

#define ALLOCATION_TAG "AuxProxyMessageSender"

AuxProxyMessageSender::AuxProxyMessageSender(sio::client* sioClient)
    : m_sio_client(sioClient)
{
}

AuxProxyMessageSender::~AuxProxyMessageSender()
{
    m_sio_client = nullptr;
}

#ifdef GAMELIFT_USE_STD
GenericOutcome AuxProxyMessageSender::ProcessReady(int port, const Aws::GameLift::Server::LogParameters &logParameters)
{
    pbuffer::ProcessReady* event = new pbuffer::ProcessReady;
    event->set_port(port);
    for (int i = 0; i < logParameters.getLogPaths().size(); i++) {
        event->add_logpathstoupload(logParameters.getLogPaths().at(i).c_str());
    }

    return EmitEvent(event);
}
#else
GenericOutcome AuxProxyMessageSender::ProcessReady(int port, const Aws::GameLift::Server::LogParameters &logParameters)
{
    pbuffer::ProcessReady* event = new pbuffer::ProcessReady;
    event->set_port(port);

    for (int i = 0; i < logParameters.getLogPathCount(); i++) {
        event->add_logpathstoupload(logParameters.getLogPath(i));
    }

    return EmitEvent(event);
}
#endif

GenericOutcome AuxProxyMessageSender::ProcessEnding()
{
    pbuffer::ProcessEnding* event = new pbuffer::ProcessEnding;
    return EmitEvent(event);
}

GenericOutcome AuxProxyMessageSender::ActivateGameSession(std::string gameSessionId)
{
    pbuffer::GameSessionActivate* event = new pbuffer::GameSessionActivate;
    event->set_gamesessionid(gameSessionId.c_str());
    return EmitEvent(event);
}

GenericOutcome AuxProxyMessageSender::UpdatePlayerSessionCreationPolicy(std::string gameSessionId, std::string newPlayerSessionPolicy)
{
    pbuffer::UpdatePlayerSessionCreationPolicy* event = new pbuffer::UpdatePlayerSessionCreationPolicy;
    event->set_gamesessionid(gameSessionId.c_str());
    event->set_newplayersessioncreationpolicy(newPlayerSessionPolicy.c_str());
    return EmitEvent(event);
}

GenericOutcome AuxProxyMessageSender::TerminateGameSession(std::string gameSessionId)
{
    pbuffer::GameSessionTerminate* event = new pbuffer::GameSessionTerminate;
    event->set_gamesessionid(gameSessionId.c_str());
    return EmitEvent(event);
}

GenericOutcome AuxProxyMessageSender::AcceptPlayerSession(std::string playerSessionId, std::string gameSessionId)
{
    pbuffer::AcceptPlayerSession* event = new pbuffer::AcceptPlayerSession;
    event->set_playersessionid(playerSessionId.c_str());
    event->set_gamesessionid(gameSessionId.c_str());
    return EmitEvent(event);
}

GenericOutcome AuxProxyMessageSender::RemovePlayerSession(std::string playerSessionId, std::string gameSessionId)
{
    pbuffer::RemovePlayerSession* event = new pbuffer::RemovePlayerSession;
    event->set_playersessionid(playerSessionId.c_str());
    event->set_gamesessionid(gameSessionId.c_str());
    return EmitEvent(event);
}

DescribePlayerSessionsOutcome AuxProxyMessageSender::DescribePlayerSessions(const DescribePlayerSessionsRequest &describePlayerSessionsRequest)
{
    pbuffer::DescribePlayerSessionsRequest* event = DescribePlayerSessionsMapper::ParseFromDescribePlayerSessionsRequest(describePlayerSessionsRequest);
    return Call(event);
}

StartMatchBackfillOutcome AuxProxyMessageSender::BackfillMatchmaking(const StartMatchBackfillRequest &request)
{
    pbuffer::BackfillMatchmakingRequest* event = BackfillMatchmakingRequestMapper::ParseFromBackfillMatchmakingRequest(request);
    return Call(event);
}

GenericOutcome AuxProxyMessageSender::StopMatchmaking(const StopMatchBackfillRequest &request)
{
    pbuffer::StopMatchmakingRequest* event = BackfillMatchmakingRequestMapper::ParseFromStopMatchmakingRequest(request);
    return EmitEvent(event);
}


GenericOutcome AuxProxyMessageSender::ReportHealth(bool healthStatus)
{
    pbuffer::ReportHealth* event = new pbuffer::ReportHealth;
    event->set_healthstatus(healthStatus);

    return EmitEvent(event);
}

std::shared_ptr<std::string> AuxProxyMessageSender::ParseMessage(google::protobuf::MessageLite* message)
{
	return std::make_shared<std::string>(message->SerializePartialAsString());
}

GenericOutcome AuxProxyMessageSender::EmitEvent(google::protobuf::MessageLite* message)
{
    std::shared_ptr<std::promise<GenericOutcome>> promise = std::make_shared<std::promise<GenericOutcome>>();

    // We bind a lambda to handle the ACK from AuxProxy. We have our lambda take a promise so we can resolve it later synchronously.
    std::function<void(sio::message::list const&)> ackFunction = std::bind([](sio::message::list const& msg, std::shared_ptr<std::promise<Aws::GameLift::GenericOutcome>> p)
    {
        bool success = msg[0]->get_bool();
        if (!success)
        {
            p->set_value(GenericOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::SERVICE_CALL_FAILED)));
            return;
        }
        p->set_value(GenericOutcome(nullptr));
        return;
    }, std::placeholders::_1, promise);

    Send(message, ackFunction);

    return promise->get_future().get();
}

DescribePlayerSessionsOutcome AuxProxyMessageSender::Call(pbuffer::DescribePlayerSessionsRequest* message)
{
    std::shared_ptr<std::promise<DescribePlayerSessionsOutcome>> promise = std::make_shared<std::promise<DescribePlayerSessionsOutcome>>();

    // We bind a lambda to handle the ACK from AuxProxy. We have our lambda take a promise so we can resolve it later synchronously.
    std::function<void(sio::message::list const&)> ackFunction = std::bind([](sio::message::list const& msg, std::shared_ptr<std::promise<DescribePlayerSessionsOutcome>> p)
    {
        bool success = msg[0]->get_bool();
        if (!success)
        {
            p->set_value(DescribePlayerSessionsOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::SERVICE_CALL_FAILED)));
            return;
        }
        pbuffer::DescribePlayerSessionsResponse describePlayerSessionsResponse;
        if (!google::protobuf::util::JsonStringToMessage(msg[1]->get_string(), &describePlayerSessionsResponse).ok())
        {
            p->set_value(DescribePlayerSessionsOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::SERVICE_CALL_FAILED)));
            return;
        }

        DescribePlayerSessionsResult result;
        DescribePlayerSessionsMapper::ParseFromBufferedDescribePlayerSessionsResponse(describePlayerSessionsResponse, result);
        p->set_value(DescribePlayerSessionsOutcome(result));
        return;
    }, std::placeholders::_1, promise);

    Send(message, ackFunction);

    return promise->get_future().get();
}

StartMatchBackfillOutcome AuxProxyMessageSender::Call(pbuffer::BackfillMatchmakingRequest* message)
{
    std::shared_ptr<std::promise<StartMatchBackfillOutcome>> promise = std::make_shared<std::promise<StartMatchBackfillOutcome>>();

    // We bind a lambda to handle the ACK from AuxProxy. We have our lambda take a promise so we can resolve it later synchronously.
    std::function<void(sio::message::list const&)> ackFunction = std::bind([](sio::message::list const& msg, std::shared_ptr<std::promise<StartMatchBackfillOutcome>> p)
    {
        bool success = msg[0]->get_bool();
        if (!success)
        {
            p->set_value(StartMatchBackfillOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::SERVICE_CALL_FAILED)));
            return;
        }
        pbuffer::BackfillMatchmakingResponse backfillMatchmakingResponse;
        if (!google::protobuf::util::JsonStringToMessage(msg[1]->get_string(), &backfillMatchmakingResponse).ok())
        {
            p->set_value(StartMatchBackfillOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::SERVICE_CALL_FAILED)));
            return;
        }

        StartMatchBackfillResult result;
        BackfillMatchmakingRequestMapper::ParseFromBufferedBackfillMatchmakingResponse(backfillMatchmakingResponse, result);
        p->set_value(StartMatchBackfillOutcome(result));
        return;
    }, std::placeholders::_1, promise);

    Send(message, ackFunction);

    return promise->get_future().get();
}

void AuxProxyMessageSender::Send(google::protobuf::MessageLite* message, std::function<void(sio::message::list const&)> ackFunction) {
    m_lock.lock();
    m_sio_client->socket()->emit(message->GetTypeName(), ParseMessage(message), ackFunction);
    m_lock.unlock();

    // We hand-allocated the message, so we must destroy it here.
    delete message;
}
