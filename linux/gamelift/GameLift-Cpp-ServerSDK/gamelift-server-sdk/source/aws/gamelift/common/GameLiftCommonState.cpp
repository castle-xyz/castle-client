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

#include <aws/gamelift/internal/GameLiftCommonState.h>

using namespace Aws::GameLift;

// This is a shared pointer because many contexts (DLLs) may point to the same state if InitializeWithExisting is used.
Internal::GameLiftCommonState* Internal::GameLiftCommonState::m_instance;

Internal::GameLiftCommonState::GameLiftCommonState()
{}

Internal::GameLiftCommonState::~GameLiftCommonState()
{}

GenericOutcome Internal::GameLiftCommonState::SetInstance(Internal::GameLiftCommonState* instance)
{
    // If there already is an instance, fail.
    if (m_instance)
    {
        return GenericOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::ALREADY_INITIALIZED));
    }

    // take ownership of the new instance
    m_instance = instance;
    return GenericOutcome(nullptr);
}

Internal::GetInstanceOutcome
Internal::GameLiftCommonState::GetInstance()
{
    if (!m_instance)
    {
        return Internal::GetInstanceOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::NOT_INITIALIZED));
    }

    return m_instance;
}

Internal::GetInstanceOutcome 
Internal::GameLiftCommonState::GetInstance(Internal::GAMELIFT_INTERNAL_STATE_TYPE stateType)
{
    if (!m_instance)
    {
        return Internal::GetInstanceOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::NOT_INITIALIZED));
    }

    if (m_instance->GetStateType() != stateType)
    {
        return Internal::GetInstanceOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::INITIALIZATION_MISMATCH));
    }
    return m_instance;
}

GenericOutcome Internal::GameLiftCommonState::DestroyInstance()
{
    if (m_instance)
    {
        delete m_instance;
        m_instance = nullptr;
        return GenericOutcome(nullptr);
    }
	return GenericOutcome(GameLiftError(GAMELIFT_ERROR_TYPE::NOT_INITIALIZED));
}
