#import <Foundation/Foundation.h>
#import <Vision/Vision.h>
int main(int argc, const char * argv[]) { @autoreleasepool {
 NSString *dir = [NSString stringWithUTF8String:argv[1]];
 NSArray *files = [[[NSFileManager defaultManager] contentsOfDirectoryAtPath:dir error:nil] sortedArrayUsingSelector:@selector(compare:)];
 for (NSString *name in files) { @autoreleasepool {
  if (![name hasSuffix:@".png"]) continue;
  NSURL *url = [NSURL fileURLWithPath:[dir stringByAppendingPathComponent:name]];
  VNRecognizeTextRequest *req = [[VNRecognizeTextRequest alloc] init];
  req.recognitionLevel = VNRequestTextRecognitionLevelAccurate;
  req.recognitionLanguages = @[@"it-IT", @"en-US"];
  VNImageRequestHandler *handler = [[VNImageRequestHandler alloc] initWithURL:url options:@{}];
  NSError *err = nil;
  if ([handler performRequests:@[req] error:&err]) {
   NSMutableArray *lines = [NSMutableArray array];
   for (VNRecognizedTextObservation *ob in req.results) { [lines addObject:[[ob topCandidates:1] firstObject].string]; }
   [[lines componentsJoinedByString:@"\n"] writeToFile:[[url.path stringByDeletingPathExtension] stringByAppendingPathExtension:@"txt"] atomically:YES encoding:NSUTF8StringEncoding error:nil];
   printf("%s\n", name.UTF8String); fflush(stdout);
  } else { NSLog(@"%@", err); }
 }
 }
} return 0; }
