#import <Foundation/Foundation.h>

@interface GhostFileSystem : NSObject

+ (NSString *)ghostCachesDirectory;
+ (NSString *)ghostDocumentsDirectory;
+ (NSString *)pathToFileInAppBundle:(NSString *)filename;

@end
