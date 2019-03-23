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

+ (void)unzip:(NSString *)zipPath toDirectory:(NSString *)toDirectory {
  // `unzip` will always create a new directory,
  // so we run `unzip` from the zip's original directory and then move the resulting child.
  NSString *parentDirectory = [toDirectory stringByDeletingLastPathComponent];
  BOOL isDirectory;
  NSError *err;
  BOOL exists =
      [[NSFileManager defaultManager] fileExistsAtPath:parentDirectory isDirectory:&isDirectory];
  if (!exists) {
    [[NSFileManager defaultManager] createDirectoryAtPath:parentDirectory
                              withIntermediateDirectories:NO
                                               attributes:nil
                                                    error:&err];
    if (err) {
      NSLog(@"%s: The containing directory '%@' does not exist and we cannot create it", __func__,
            parentDirectory);
      return;
    }
  }

  // unzip the files
  NSString *zipDirectory = [zipPath stringByDeletingLastPathComponent];
  NSString *zipFilename = [zipPath lastPathComponent];
  NSTask *unzipTask = [[NSTask alloc] init];
  [unzipTask setLaunchPath:@"/usr/bin/unzip"];
  [unzipTask setCurrentDirectoryPath:zipDirectory];
  [unzipTask setArguments:@[ zipFilename ]];
  [unzipTask launch];
  [unzipTask waitUntilExit];

  // `unzip` will always create a new directory named after the archive's filename
  // so we want to correct that to be the path actually specified by `toDirectory`.
  NSString *createdDirectoryName = [zipFilename stringByDeletingPathExtension];
  NSString *createdDirectoryPath =
      [zipDirectory stringByAppendingPathComponent:createdDirectoryName];

  err = nil;
  [[NSFileManager defaultManager] moveItemAtPath:createdDirectoryPath
                                          toPath:toDirectory
                                           error:&err];
}

+ (NSString *)projectFilenameAtPath:(NSString *)path {
  NSArray *dirFiles = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:path error:nil];
  NSArray *castleFiles = [dirFiles
      filteredArrayUsingPredicate:[NSPredicate predicateWithFormat:@"self ENDSWITH '.castle'"]];
  if (castleFiles.count) {
    return castleFiles.firstObject;
  }
  return nil;
}

@end
