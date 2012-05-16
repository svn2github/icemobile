/*
* Copyright 2004-2011 ICEsoft Technologies Canada Corp. (c)
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions an
* limitations under the License.
*/

#import "ViewController.h"
#import "NativeInterface.h"

@implementation ViewController
@synthesize nativeInterface;
@synthesize currentURL;
@synthesize returnURL;
@synthesize currentParameters;
@synthesize currentCommand;
@synthesize currentSessionId;
@synthesize uploadProgress;
@synthesize uploadLabel;
@synthesize linkView;
@synthesize urlField;
@synthesize actionSelector;
@synthesize deviceToken;
@synthesize confirmMessages;
@synthesize confirmTitles;
@synthesize commandNames;


- (void) dealloc  {
    [self.confirmTitles dealloc];
    [self.confirmMessages dealloc];
    [self.commandNames dealloc];
    [super dealloc];
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Release any cached data, images, etc that aren't in use.
}

- (void)register   {
    NSMutableDictionary *params = [nativeInterface parseQuery:currentParameters];

    if (nil != self.deviceToken)  {
        const unsigned *tokenBytes = (unsigned int*) [self.deviceToken bytes];
        NSString *hexToken = [NSString stringWithFormat:
                @"apns:%08x%08x%08x%08x%08x%08x%08x%08x",
                ntohl(tokenBytes[0]), ntohl(tokenBytes[1]), ntohl(tokenBytes[2]),
                ntohl(tokenBytes[3]), ntohl(tokenBytes[4]), ntohl(tokenBytes[5]),
                ntohl(tokenBytes[6]), ntohl(tokenBytes[7])];

        [params setValue:hexToken forKey:@"iceCloudPushId"];
    }
    [self decorateParams: params];
    [nativeInterface multipartPost:params toURL:self.currentURL];
}

- (void)completePost:(NSString *)value forComponent:(NSString *)componentID withName:(NSString *)componentName   {
    NSMutableDictionary *params = [nativeInterface parseQuery:currentParameters];
    [self decorateParams: params];
    if (nil != componentName)  {
        [params setValue:value forKey:componentName];
    } else {
        NSLog(@"Warning: upload without componentName");
    }
    [nativeInterface multipartPost:params toURL:self.currentURL];
}

- (void) reloadCurrentURL  {
    NSString *safariURL = self.currentURL;
    if (nil != self.returnURL)  {
        safariURL = self.returnURL;
    }

    NSLog(@"ICEmobile-SX will open %@", safariURL);
    [[UIApplication sharedApplication] 
            openURL:[NSURL URLWithString:safariURL]];
}

- (void)completeFile:(NSString *)path forComponent:(NSString *)componentID withName:(NSString *)componentName   {
    [self completePost:path forComponent:componentID 
            withName:[@"file-" stringByAppendingString: componentName]];
}

- (NSString *) prepareUpload:(NSString *)formID  {
    NSString *scriptTemplate = @"document.getElementById(\"%@\").action;";
    NSString *script = [NSString stringWithFormat:scriptTemplate, formID];
NSLog(@"Hitch just upload what would have been scripted %@", script);
    
    scriptTemplate = @"document.location.href;";
    script = [NSString stringWithFormat:scriptTemplate, formID];
NSLog(@"Hitch just upload what would have been scripted %@", script);

NSLog(@"Hitch just upload what would have been scripted %@", script);

    return @"unknown";
}

- (void) decorateParams:(NSMutableDictionary*) params {
    for (NSString *key in params)  {
        NSString *value = [params objectForKey:key];
        [params removeObjectForKey:key];
        [params setValue:value forKey:[@"hidden-" stringByAppendingString:key]];
    }
}

- (NSString *) getFormData:(NSString *)formID  {
    NSString *scriptTemplate = @"ice.getCurrentSerialized();";
    NSString *script = [NSString stringWithFormat:scriptTemplate, formID];
NSLog(@"Hitch just upload what would have been scripted %@", script);

    return @"unkown";
}

- (void) hideProgress  {
    uploadLabel.hidden = YES;
    uploadProgress.hidden = YES;
    linkView.hidden = NO;
}

- (void) setProgress:(NSInteger)percent  {
    linkView.hidden = YES;
    uploadLabel.hidden = NO;
    uploadProgress.hidden = NO;
    [uploadProgress setProgress:percent / 100.0f];
NSLog(@"Native progress display %d", percent);
}

- (void) handleResponse:(NSString *)responseString  {
    NSLog(@"handleResponse received %@", responseString);
    [self reloadCurrentURL];
}

- (void)play: (NSString*)audioId  {
NSLog(@"Hitch cant play audio from an ID in the page");
}

- (void)setThumbnail: (UIImage*)image at: (NSString *)thumbID  {
NSLog(@"Hitch would show a thumbnail");
}


- (void) dispatchCurrentCommand  {
    NSArray *queryParts = [self.currentCommand 
            componentsSeparatedByString:@"?"];
    NSString *commandName = [queryParts objectAtIndex:0];

    NSString *title = [self.confirmTitles objectForKey:commandName];
    NSString *message = [self.confirmMessages objectForKey:commandName];
    NSString *host = [[NSURL URLWithString:self.currentURL] host];
    message = [[message stringByAppendingString:host] 
            stringByAppendingString:@"?" ];

    if (nil == title)  {
        NSLog(@"Command not valid %@", self.currentCommand);
        return;
    }

    UIAlertView *alert = [[UIAlertView alloc] 
            initWithTitle:title 
            message:message 
            delegate:self cancelButtonTitle:@"OK" 
            otherButtonTitles:@"Cancel",nil];
    [alert show];
    [alert release];
}

- (void)alertView:(UIAlertView *)alertView didDismissWithButtonIndex:(NSInteger)buttonIndex {

    if (buttonIndex == 0) {
        NSURL *theURL = [NSURL URLWithString:self.currentURL];
        NSString *host = [theURL host];
        NSString *contextPath = [[theURL pathComponents] objectAtIndex:1];
        NSString *cookiePath = [[@"/" stringByAppendingString:contextPath]
                stringByAppendingString:@"/"];
NSLog(@"setCookie contextPath %@ ", contextPath );

        NSDictionary *properties = [[NSDictionary alloc] initWithObjectsAndKeys:
                @"JSESSIONID", NSHTTPCookieName,
                currentSessionId, NSHTTPCookieValue,
                cookiePath, NSHTTPCookiePath,
                host, NSHTTPCookieDomain,
                nil ];

        NSHTTPCookie *cookie = [NSHTTPCookie cookieWithProperties:properties];
        NSLog(@"setCookie %@ ", cookie );
        [[NSHTTPCookieStorage sharedHTTPCookieStorage] setCookie: cookie];
NSLog(@"currentCookies %@ ", [NSHTTPCookieStorage sharedHTTPCookieStorage].cookies );

        [nativeInterface dispatch:self.currentCommand];
    }
NSLog(@"Alert dismissed via button %d", buttonIndex);

}

- (IBAction) doMediacast  {
    NSLog(@"ViewController doMediacast");
    [[UIApplication sharedApplication] 
            openURL:[NSURL 
                    URLWithString:@"http://mediacast.icemobile.org"]];
}

- (IBAction) doMobileshowcase  {
    NSLog(@"ViewController doMobileshowcase");
    [[UIApplication sharedApplication] 
            openURL:[NSURL 
                    URLWithString:@"http://mobileshowcase.icemobile.org"]];
}

- (IBAction) chooseAction  {
    NSLog(@"ViewController chooseAction %d", actionSelector.selectedSegmentIndex);
    self.currentURL = urlField.text;
    [urlField resignFirstResponder];
    self.returnURL = self.currentURL;
    self.currentParameters = nil;
    NSString *theCommand = [self.commandNames 
            objectAtIndex:actionSelector.selectedSegmentIndex];
    CGRect selectionFrame = actionSelector.frame;
    selectionFrame = [actionSelector.superview convertRect:selectionFrame 
            toView:self.view];
    CGFloat cellWidth = 
            selectionFrame.size.width / actionSelector.numberOfSegments;
    CGFloat popOffset = selectionFrame.origin.x + 
            cellWidth * actionSelector.selectedSegmentIndex;
    self.nativeInterface.popoverSource = CGRectMake(popOffset, 
            selectionFrame.origin.y, cellWidth, selectionFrame.size.height);
    self.currentCommand = [NSString stringWithFormat:@"%@?id=undefined", theCommand];
    [actionSelector setSelectedSegmentIndex:-1];
    [self dispatchCurrentCommand];
}

- (IBAction) returnPressed  {
    NSLog(@"ViewController returnPressed");
}

#pragma mark - View lifecycle

- (void)viewDidLoad
{
    [super viewDidLoad];
	// Do any additional setup after loading the view, typically from a nib.
    self.nativeInterface = [[NativeInterface alloc] init];
    self.nativeInterface.controller = self;
    self.nativeInterface.uploading = NO;
    self.confirmTitles = [NSDictionary dictionaryWithObjectsAndKeys:
            @"Register", @"register", 
            @"Photo Upload", @"camera", 
            @"Video Upload", @"camcorder", 
            @"Audio Upload", @"microphone", 
            @"QR Code Scan", @"scan", 
            @"Augmented Reality View", @"aug", 
            nil];
    self.confirmMessages = [NSDictionary dictionaryWithObjectsAndKeys:
            @"Register with server ", @"register", 
            @"Upload photo to ", @"camera", 
            @"Upload video to ", @"camcorder", 
            @"Upload audio recording to ", @"microphone", 
            @"Send QR Code to ", @"scan", 
            @"Send augmented reality location to ", @"aug", 
            nil];
    self.commandNames = [NSArray arrayWithObjects:
            @"camera", 
            @"camcorder", 
            @"microphone", 
            @"scan", 
            @"aug", 
            nil];
}

- (void)viewDidUnload
{
    [super viewDidUnload];
    // Release any retained subviews of the main view.
    // e.g. self.myOutlet = nil;
}

- (void)viewWillAppear:(BOOL)animated
{
    [super viewWillAppear:animated];
}

- (void)viewDidAppear:(BOOL)animated
{
    [super viewDidAppear:animated];
}

- (void)viewWillDisappear:(BOOL)animated
{
	[super viewWillDisappear:animated];
}

- (void)viewDidDisappear:(BOOL)animated
{
	[super viewDidDisappear:animated];
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation
{
    // Return YES for supported orientations
    if ([[UIDevice currentDevice] userInterfaceIdiom] == UIUserInterfaceIdiomPhone) {
        return (interfaceOrientation != UIInterfaceOrientationPortraitUpsideDown);
    } else {
        return YES;
    }
}

- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event  {
    [urlField resignFirstResponder];
}

- (void)applicationWillResignActive {
    [self.nativeInterface applicationWillResignActive];
}

@end
