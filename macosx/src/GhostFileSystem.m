#import "GhostFileSystem.h"

#import <Cocoa/Cocoa.h>

@implementation GhostFileSystem

/**
 *  Provides the path CEF uses for LocalStorage.
 *  Note: If testing LocalStorage, you cannot use the Stop button from Xcode.
 *  You need to properly terminate the program (i.e. with Cmd+Q) for LocalStorage to flush.
 *  Reference: https://magpcss.org/ceforum/viewtopic.php?f=6&t=13332
 */
+ (NSString *)ghostCachesDirectory {
  NSError *err;
  NSURL *userCacheFileUrl = [[NSFileManager defaultManager] URLForDirectory:NSCachesDirectory
                                                                   inDomain:NSUserDomainMask
                                                          appropriateForURL:nil
                                                                     create:YES
                                                                      error:&err];
  if (userCacheFileUrl) {
    NSString *bundleId = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleIdentifier"];
    NSURL *ghostCacheFileUrl = [userCacheFileUrl URLByAppendingPathComponent:bundleId];
    NSString *ghostCachePath = [ghostCacheFileUrl path];
    BOOL isDirectory;
    BOOL exists =
        [[NSFileManager defaultManager] fileExistsAtPath:ghostCachePath isDirectory:&isDirectory];
    if (!exists) {
      [[NSFileManager defaultManager] createDirectoryAtPath:ghostCachePath
                                withIntermediateDirectories:YES
                                                 attributes:nil
                                                      error:&err];
      if (err) {
        NSLog(@"%s: Error creating cache directory %@", __func__, ghostCachePath);
      }
    }
    return ghostCachePath;
  }
  return nil;
}

+ (NSString *)ghostDocumentsDirectory {
  NSError *err;
  NSURL *userDocumentUrl = [[NSFileManager defaultManager] URLForDirectory:NSDocumentDirectory
                                                                  inDomain:NSUserDomainMask
                                                         appropriateForURL:nil
                                                                    create:YES
                                                                     error:&err];
  if (userDocumentUrl) {
    return [userDocumentUrl path];
  }
  return nil;
}

+ (NSString *)pathToFileInAppBundle:(NSString *)filename {
  if (filename) {
    return [[NSBundle mainBundle] pathForResource:filename ofType:nil];
  }
  return nil;
}

@end
