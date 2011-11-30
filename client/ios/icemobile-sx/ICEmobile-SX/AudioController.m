//
//  AudioController.m
//  ICEmobile-SX
//
//  Created by Ted Goddard on 11-11-29.
//  Copyright (c) 2011 ICEsoft Technologies, Inc. All rights reserved.
//

#import "AudioController.h"
#import "NativeInterface.h"

@implementation AudioController

@synthesize nativeInterface;

- (IBAction) doRecord  {
    NSLog(@"AudioController doRecord");
    [self.nativeInterface recordStart];
}

- (IBAction) doStop  {
    NSLog(@"AudioController doStop");
    [self.nativeInterface recordStop];
}

- (IBAction) doDone  {
    NSLog(@"AudioController doDone");
    [self.nativeInterface recordDone];
}

- (IBAction) doCancel  {
    NSLog(@"AudioController doCancel");
    [self.nativeInterface recordDismiss];
}


- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
        // Custom initialization
    }
    return self;
}

- (void)didReceiveMemoryWarning
{
    // Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];
    
    // Release any cached data, images, etc that aren't in use.
}

#pragma mark - View lifecycle

- (void)viewDidLoad
{
    [super viewDidLoad];
    // Do any additional setup after loading the view from its nib.
}

- (void)viewDidUnload
{
    [super viewDidUnload];
    // Release any retained subviews of the main view.
    // e.g. self.myOutlet = nil;
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation
{
    // Return YES for supported orientations
    return (interfaceOrientation == UIInterfaceOrientationPortrait);
}

@end
