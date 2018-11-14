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
#include <aws/gamelift/server/LogParameters.h>

#ifndef GAMELIFT_USE_STD
#include "string.h"
#endif

#ifndef GAMELIFT_USE_STD
Aws::GameLift::Server::LogParameters::LogParameters(const char** logPaths, int count)
{
    m_count = (count < MAX_LOG_PATHS) ? count : MAX_LOG_PATHS;
    for (int i = 0; i < m_count; ++i)
    {
        
        #ifdef WIN32
        strcpy_s(m_logPaths[i], MAX_PATH_LENGTH, logPaths[i]);
        #else
        strncpy(m_logPaths[i], logPaths[i], MAX_PATH_LENGTH);
        #endif
    }
}
#endif