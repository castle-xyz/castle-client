// Wrapped by 'FileServer.js'.

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

#import "GCDWebDAVServer.h"

@interface FileServer
    : RCTEventEmitter <RCTBridgeModule, GCDWebDAVServerDelegate>

@property(nonatomic, strong) GCDWebDAVServer *davServer;

@end

@implementation FileServer

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

- (void)dealloc {
  if (self.davServer && self.davServer.running) {
    [self.davServer stop];
  }
}

//
// Methods
//

RCT_EXPORT_METHOD(startAsync
                  : (NSDictionary *)options
                  : (RCTPromiseResolveBlock)resolve
                  : (RCTPromiseRejectBlock)reject) {
  // Make sure we're not already running
  if (self.davServer && self.davServer.running) {
    reject(@"E_FILE_SERVER",
           @"`FileServer.startAsync`: already running when called", nil);
    return;
  }

  // Read `options.directory`
  NSString *directoryUri = options[@"directory"];
  if (!directoryUri) {
    reject(@"E_FILE_SERVER",
           @"`FileServer.startAsync`: need `options.directory`", nil);
    return;
  }
  NSURL *directoryUrl = [NSURL URLWithString:directoryUri];
  if (!directoryUrl) {
    reject(@"E_FILE_SERVER",
           @"`FileServer.startAsync`: `options.directory` is not a URI", nil);
    return;
  }
  NSString *directoryPath = directoryUrl.path;

  // Start!
  self.davServer =
      [[GCDWebDAVServer alloc] initWithUploadDirectory:directoryPath];
  self.davServer.delegate = self;
  self.davServer.allowHiddenItems = true;
  [self.davServer start];
  resolve(nil);
}

RCT_EXPORT_METHOD(stopAsync
                  : (RCTPromiseResolveBlock)resolve
                  : (RCTPromiseRejectBlock)reject) {
  if (self.davServer) {
    if (self.davServer.running) {
      [self.davServer stop];
    }
    self.davServer = nil;
    resolve(nil);
  } else {
    reject(@"E_FILE_SERVER", @"`FileServer.stopAsync`: not running", nil);
  }
}

//
// Events
//

- (NSArray<NSString *> *)supportedEvents {
  return @[ @"start", @"bonjour", @"send", @"change" ];
}

- (void)webServerDidStart:(GCDWebServer *)server {
  if (server.serverURL) {
    [self sendEventWithName:@"start"
                       body:@{@"url" : server.serverURL.absoluteString}];
  } else {
    [self sendEventWithName:@"start" body:@{}];
  }
}

- (void)webServerDidCompleteBonjourRegistration:(GCDWebServer *)server {
  if (server.bonjourServerURL) {
    [self sendEventWithName:@"bonjour"
                       body:@{@"url" : server.bonjourServerURL.absoluteString}];
  } else {
    [self sendEventWithName:@"bonjour" body:@{}];
  }
}

- (void)davServer:(GCDWebDAVServer *)server
    didDownloadFileAtPath:(NSString *)path {
  [self sendEventWithName:@"send"
                     body:@{
                       @"item" : [NSURL fileURLWithPath:path].absoluteString
                     }];
}

- (void)davServer:(GCDWebDAVServer *)server
    didUploadFileAtPath:(NSString *)path {
  [self sendEventWithName:@"change"
                     body:@{
                       @"type" : @"upload",
                       @"item" : [NSURL fileURLWithPath:path].absoluteString
                     }];
}

- (void)davServer:(GCDWebDAVServer *)server
    didMoveItemFromPath:(NSString *)fromPath
                 toPath:(NSString *)toPath {
  [self
      sendEventWithName:@"change"
                   body:@{
                     @"type" : @"move",
                     @"from" : [NSURL fileURLWithPath:fromPath].absoluteString,
                     @"to" : [NSURL fileURLWithPath:toPath].absoluteString
                   }];
}

- (void)davServer:(GCDWebDAVServer *)server
    didCopyItemFromPath:(NSString *)fromPath
                 toPath:(NSString *)toPath {
  [self
      sendEventWithName:@"change"
                   body:@{
                     @"type" : @"copy",
                     @"from" : [NSURL fileURLWithPath:fromPath].absoluteString,
                     @"to" : [NSURL fileURLWithPath:toPath].absoluteString
                   }];
}

- (void)davServer:(GCDWebDAVServer *)server
    didDeleteItemAtPath:(NSString *)path {
  [self sendEventWithName:@"change"
                     body:@{
                       @"type" : @"delete",
                       @"item" : [NSURL fileURLWithPath:path].absoluteString
                     }];
}

- (void)davServer:(GCDWebDAVServer *)server
    didCreateDirectoryAtPath:(NSString *)path {
  [self sendEventWithName:@"change"
                     body:@{
                       @"type" : @"createDirectory",
                       @"item" : [NSURL fileURLWithPath:path].absoluteString
                     }];
}

@end
