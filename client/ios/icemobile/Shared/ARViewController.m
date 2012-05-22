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

#import "ARViewController.h"
#import "PlaceLabel.h"
#import "ARView.h"
#import "MapController.h"

@interface ARViewController ()

@end

@implementation ARViewController
@synthesize compassSwitch;

- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
        // Custom initialization
    }
    return self;
}

- (void)viewWillAppear:(BOOL)animated  {
	[super viewWillAppear:animated];
	ARView *arView = (ARView *)self.view;
    arView.useCompass = compassSwitch.on; 
	[arView start];
}

- (void)viewDidAppear:(BOOL)animated  {
	[super viewDidAppear:animated];
}

- (void)viewWillDisappear:(BOOL)animated  {
	[super viewWillDisappear:animated];
}

- (void)viewDidDisappear:(BOOL)animated  {
	[super viewDidDisappear:animated];
	ARView *arView = (ARView *)self.view;
	[arView stop];
}

- (void)viewDidLoad
{
	[super viewDidLoad];
}

- (void)viewDidUnload
{
    [super viewDidUnload];
    // Release any retained subviews of the main view.
    // e.g. self.myOutlet = nil;
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation
{
	return NO;
}

- (void)setPlaceLabels:(NSArray *)places {
	ARView *arView = (ARView *)self.view;
	[arView setPlaceLabels:places];	
}

- (IBAction) doLocations  {
    NSLog(@"ARViewController doLocations");
	ARView *arView = (ARView *)self.view;
	NSLog(@"ARViewController currentLocation, %f,%f", arView.location.coordinate.latitude, arView.location.coordinate.longitude);
    //bring up map view
    MapController *mapController = [[MapController alloc] init];
    [[NSBundle mainBundle] loadNibNamed:@"MapController" 
            owner:mapController options:nil];
//    mapController.nativeInterface = self;
    mapController.arView = arView;
    if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad)  {
//        if (nil == self.mapPopover)  {
//            self.mapPopover = [[UIPopoverController alloc] 
//                    initWithContentViewController:mapController];
//            self.mapPopover.popoverContentSize = CGSizeMake(320, 480);
//        }
//        [self.mapPopover presentPopoverFromRect:popoverSource 
//                                 inView:controllerView
//               permittedArrowDirections:UIPopoverArrowDirectionAny 
//                               animated:YES];
    } else {
        [self presentModalViewController:mapController animated:YES];
    }
    [mapController.mapView setCenterCoordinate: arView.location.coordinate];
    [mapController release];
}

- (IBAction) compassChanged:(UISwitch *)theSwitch {
	ARView *arView = (ARView *)self.view;
    [arView setCompass:theSwitch.on]; 
}

- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event  {
NSLog(@"TODO: implement return to browser from label selection");
    [self dismissModalViewControllerAnimated:YES];
}

@end
