// Override `EXFileSystem` permissions to allow read + write anywhere

#import "EXFileSystem.h"

@implementation EXFileSystem (Brushy)

- (EXFileSystemPermissionFlags)permissionsForURI:(NSURL *)uri {
  return EXFileSystemPermissionRead | EXFileSystemPermissionWrite;
}

@end
