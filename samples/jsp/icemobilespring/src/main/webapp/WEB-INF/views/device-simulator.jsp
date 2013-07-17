<!doctype html>
<html lang="en-us" class="portrait">
<head>
    <meta charset="utf-8">
    <title>ICEmobile Simulator</title>
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" >
    <link rel="stylesheet" media="screen" href="./resources/device-simulator.css">
    <link href="./resources/images/favicon.ico" rel="icon" type="image/x-icon">
    <link href="./resources/images/favicon.ico" rel="shortcut icon" type="image/x-icon">
</head>
<body>
    <div id="header-container">
        <header class="wrapper">
            <a href="http://www.icesoft.org/java/projects/ICEmobile/overview.jsf"
                class="icemobile-icon">
                <img src="./resources/images/icemobile-logo.png">
            </a>
            <h1>ICEmobile Device Simulator</h1>
            
            <div id="showcase-btns">
                <a href="http://mobileshowcase.icesoft.org/mobileshowcase/device-simulator.html" 
                    class="jsf-showcase" target="_self"></a>
                <span class="divider"></span>
                <a href="http://icemobilespring.icesoft.org/icemobilespring/device-simulator.html" 
                    class="jsp-showcase" target="_self"></a>
            </div>
            
            <button class="choose-device-btn" onclick="toggleChooseDevicePopup()">Choose Device</button>
            
            <div id="device-selector">
                <button id="change-orientation" onclick="toggleOrientation()"></button>
                <div class="col1">
                    <label id="iphone4-btn" for="iphoneRadio"></label>
                    <label id="bbz10-btn" for="bbz10Radio"></label>
                    <label id="bbq10-btn" for="bbq10Radio"></label>
                </div>
                <div class="col2">
                    <label id="nexus4-btn" for="nexus4Radio"></label>
                    <label id="nexus7-btn" for="nexus7Radio"></label>
                    <label id="ipad-btn" for='ipadRadio'></label>
                </div>
            </div>
            
        </header>
        
    </div>
    
    <div id="scale">
        <div>
            <label for="scaleDesktop">
                <span>Scale to desktop resolution</span>
                <input id="scaleDesktop" type="radio" 
                name="scale" onchange="sizeToDesktop()"
                checked/>
            </label>
            
        </div>
        <div>
            
            <label for="scaleDevice">
                <span>Scale to device resolution</span>
                <input id="scaleDevice" type="radio" 
                    name="scale" onchange="sizeToDevice()"/>
            </label>
            
        </div>
    </div>
    
    
    
    <article id="slider">
           
        <!-- Slider Setup -->
    
        <input type="radio" name="slider" id="iphoneRadio" onchange="openIphone()" checked="" >
        <input type="radio" name="slider" id="ipadRadio" onchange="openIpad()">
        <input type="radio" name="slider" id="nexus4Radio" onchange="openNexus4()">
        <input type="radio" name="slider" id="nexus7Radio" onchange="openNexus7()">
        <input type="radio" name="slider" id="bbz10Radio" onchange="openBBZ10()">
        <input type="radio" name="slider" id="bbq10Radio" onchange="openBBQ10Portrait()">
    
        <!-- The Slider -->
        <div id="slides">
        
            <div id="overflow">
            
                <div class="inner" id="innerSlider">
                
                    <article id="iphone-portrait-device" class="active">
                        <div class="device-type"><div>iPhone 4</div><div class="orientation">Portrait Mode</div></div>
                        <div class='deviceWrap iphone-portrait'>
                            <div class='device'>
                                <div class='flashingTop' style='height: 20px; width: 320px'>
                                    <span class='time'></span>
                                </div>
                                <div class='flashingBottom' style='height: 44px'>
                                
                                </div>
                                <iframe src='./?view=small&theme=iphone&simulator=true' id='iphone-portrait'></iframe>
                            </div>
                        </div>
                    </article>
                    
                    <article id="iphone-landscape-device">
                        <div class="device-type"><div>iPhone 4</div><div class="orientation">Landscape Mode</div></div>
                        <div class='deviceWrap iphone-landscape'>
                            <div class='device'>
                                <div class='flashingTop' style='height: 20px; width: 480px'>
                                    <span class='time'></span>
                                </div>
                                <div class='flashingBottom' style='height: 32px'>
                                
                                </div>
                                <iframe src='about:blank' id='iphone-landscape'></iframe>
                            </div>
                        </div>
                    </article>
                     
                    <article id="nexus4-portrait-device">
                        <div class="device-type"><div>Nexus 4</div><div class="orientation">Portrait Mode</div></div>
                        <div class='deviceWrap nexus4-portrait'>
                            <div class='device'>
                                <iframe src='about:blank' id='nexus4-portrait'></iframe>
                            </div>
                        </div>
                    </article>
                    
                    <article id="nexus4-landscape-device">
                        <div class="device-type"><div>Nexus 4</div><div class="orientation">Landscape Mode</div></div>
                        <div class='deviceWrap nexus4-landscape'>
                            <div class='device'>
                                <iframe src='about:blank' id='nexus4-landscape'></iframe>
                            </div>
                        </div>
                    </article>
                    
                    <article id="bbz10-portrait-device">
                        <div class="device-type"><div>BlackBerry Z10</div><div class="orientation">Portrait Mode</div></div>
                        <div class='deviceWrap bbz10-portrait'>
                            <div class='device'>
                                <iframe src='about:blank' id='bbz10-portrait'></iframe>
                            </div>
                        </div>
                    </article>
                    
                    <article id="bbz10-landscape-device">
                        <div class="device-type"><div>BlackBerry Z10</div><div class="orientation">Landscape Mode</div></div>
                        <div class='deviceWrap bbz10-landscape'>
                            <div class='device'>
                                <iframe src='about:blank' id='bbz10-landscape'></iframe>
                            </div>
                        </div>
                    </article>
                    
                    <article id="nexus7-portrait-device">
                        <div class="device-type"><div>Nexus 7</div><div class="orientation">Portrait Mode</div></div>
                        <div class='deviceWrap nexus7-portrait'>
                            <div class='device'>
                                <iframe src='about:blank' id='nexus7-portrait'></iframe>
                            </div>
                        </div>
                    </article>
                    
                    <article id="nexus7-landscape-device">
                        <div class="device-type"><div>Nexus 7</div><div class="orientation">Landscape Mode</div></div>
                        <div class='deviceWrap nexus7-landscape'>
                            <div class='device'>
                                <iframe src='about:blank' id='nexus7-landscape'></iframe>
                            </div>
                        </div>
                    </article>
                    
                    
                    
                    <article id="bbq10-portrait-device">
                        <div class="device-type"><div>BlackBerry Q10</div><div class="orientation">Portrait Mode</div></div>
                        <div class='deviceWrap bbq10-portrait'>
                            <div class='device'>
                                <iframe src='about:blank' id='bbq10-portrait'></iframe>
                            </div>
                        </div>
                    </article>
                    
                    <article id="ipad-portrait-device">
                        <div class="device-type"><div>iPad</div><div class="orientation">Portrait</div></div>
                        <div class='deviceWrap ipad-portrait'>
                            <div class='device'>
                                <div class='flashingTop' style='height: 124px; width: 768px'>
                                    <span class='time'></span>
                                </div>
                                <iframe src='about:blank' id='ipad-portrait' ></iframe>
                            </div>
                        </div>
                    </article>
                    
                    <article id="ipad-landscape-device">
                        <div class="device-type"><div>iPad</div><div class="orientation">Landscape Mode</div></div>
                        <div class='deviceWrap ipad-landscape'>
                            <div class='device'>
                                <div class='flashingTop' style='height: 96px; width: 1024px'>
                                    <span class='time'></span>
                                </div>
                                <iframe src='about:blank' id='ipad-landscape'></iframe>
                            </div>
                        </div>
                    </article>
                    
                </div> 
                
            </div> 
        
        </div> <!-- #slides -->
    
    </article> 
        
    <script>
    function setSlider(index){
        document.getElementById('innerSlider').style.marginLeft = '-' + (index*100)+'%';
    }
    function openIphone(){
        closeAllDevices();
        if( window.deviceOrientation === 'portrait' ){
            document.getElementById('iphone-portrait').setAttribute('src','./?view=small&theme=iphone&simulator=true');
            if( document.documentElement.classList ){
                document.getElementById('iphone-portrait-device').classList.add('active');
            }
            setSlider(0);
        }
        else{
            document.getElementById('iphone-landscape').setAttribute('src','./?view=small&theme=iphone&simulator=true');
            if( document.documentElement.classList ){
                document.getElementById('iphone-landscape-device').classList.add('active');
            }
            setSlider(1);
        }
    }
    function openNexus4(){
        closeAllDevices();
        if( window.deviceOrientation === 'portrait' ){
            document.getElementById('nexus4-portrait').setAttribute('src','./?view=small&theme=android_light&simulator=true');
            if( document.documentElement.classList ){
                document.getElementById('nexus4-portrait-device').classList.add('active');
            }
            setSlider(2);
        }
        else{
            document.getElementById('nexus4-landscape').setAttribute('src','./?view=small&theme=android_light&simulator=true');
            if( document.documentElement.classList ){
                document.getElementById('nexus4-landscape-device').classList.add('active');
            }
            setSlider(3);
        }
    }
    function openBBZ10(){
        closeAllDevices();
        if( window.deviceOrientation === 'portrait' ){
            document.getElementById('bbz10-portrait').setAttribute('src','./?view=small&theme=bb10&simulator=true');
            if( document.documentElement.classList ){
                document.getElementById('bbz10-portrait-device').classList.add('active');
            }
            setSlider(4);
        }
        else{
            document.getElementById('bbz10-landscape').setAttribute('src','./?view=small&theme=bb10&simulator=true');
            if( document.documentElement.classList ){
                document.getElementById('bbz10-landscape-device').classList.add('active');
            }
            setSlider(5);
        }
    }
    function openNexus7(){
        closeAllDevices();
        if( window.deviceOrientation === 'portrait' ){
            document.getElementById('nexus7-portrait').setAttribute('src','./?view=large&theme=android_dark&simulator=true');
            if( document.documentElement.classList ){
                document.getElementById('nexus7-portrait-device').classList.add('active');
            }
            setSlider(6);
        }
        else{
            document.getElementById('nexus7-landscape').setAttribute('src','./?view=large&theme=android_dark&simulator=true');
            if( document.documentElement.classList ){
                document.getElementById('nexus7-landscape-device').classList.add('active');
            }
            setSlider(7);
        }
    }
    function openBBQ10Portrait(){
        closeAllDevices();
        document.getElementById('bbq10-portrait').setAttribute('src','./?view=small&theme=bb10&simulator=true');
        if( document.documentElement.classList ){
            document.getElementById('bbq10-portrait-device').classList.add('active');
        }
        setSlider(8);
    }
    function openIpad(){
        closeAllDevices();
        if( window.deviceOrientation === 'portrait' ){
            document.getElementById('ipad-portrait').setAttribute('src','./?view=large&theme=ipad&simulator=true');
            if( document.documentElement.classList ){
                document.getElementById('ipad-portrait-device').classList.add('active');
            }
            setSlider(9);
        }
        else{
            document.getElementById('ipad-landscape').setAttribute('src','./?view=large&theme=ipad&simulator=true');
            if( document.documentElement.classList ){
                document.getElementById('ipad-landscape-device').classList.add('active');
            }
            setSlider(10);
        }
    }
    function closeAllDevices(){
        document.getElementById('iphone-portrait').setAttribute('src','about:blank');
        document.getElementById('iphone-landscape').setAttribute('src','about:blank');
        document.getElementById('ipad-portrait').setAttribute('src','about:blank');
        document.getElementById('ipad-landscape').setAttribute('src','about:blank');
        document.getElementById('nexus4-portrait').setAttribute('src','about:blank');
        document.getElementById('nexus4-landscape').setAttribute('src','about:blank');
        document.getElementById('nexus7-portrait').setAttribute('src','about:blank');
        document.getElementById('nexus7-landscape').setAttribute('src','about:blank');
        document.getElementById('bbz10-portrait').setAttribute('src','about:blank');
        document.getElementById('bbz10-landscape').setAttribute('src','about:blank');
        document.getElementById('bbq10-portrait').setAttribute('src','about:blank');
        if( document.documentElement.classList ){
            document.getElementById('iphone-portrait-device').classList.remove('active');
            document.getElementById('iphone-landscape-device').classList.remove('active');
            document.getElementById('ipad-portrait-device').classList.remove('active');
            document.getElementById('ipad-landscape-device').classList.remove('active');
            document.getElementById('nexus4-portrait-device').classList.remove('active');
            document.getElementById('nexus4-landscape-device').classList.remove('active');
            document.getElementById('nexus7-portrait-device').classList.remove('active');
            document.getElementById('nexus7-landscape-device').classList.remove('active');
            document.getElementById('bbz10-portrait-device').classList.remove('active');
            document.getElementById('bbz10-landscape-device').classList.remove('active');
            document.getElementById('bbq10-portrait-device').classList.remove('active');
        }
    }
    function sizeToDevice(){
        var devices = document.querySelectorAll('.deviceWrap');
        for( var i = 0 ; i < devices.length ; i++ ){
            devices[i].style.webkitTransform = "scale(0.65)";
            devices[i].style.transform = "scale(0.65)";
            devices[i].style.webkitTransformOrigin = "50% 0px";
            devices[i].style.transformOrigin = "50% 0px";
        }
    }
    function sizeToDesktop(){
        var devices = document.querySelectorAll('.deviceWrap');
        for( var i = 0 ; i < devices.length ; i++ ){
            devices[i].style.webkitTransform = "scale(1)";
            devices[i].style.transform = "scale(1)";
            devices[i].style.webkitTransformOrigin = "50% 0px";
            devices[i].style.transformOrigin = "50% 0px";
        }
    }
    function toggleChooseDevicePopup(){
        var popup = document.getElementById("device-selector");
        if( popup.className === 'on' ){
            popup.className = '';
        }
        else{
            popup.className = 'on';
        }
    }
    function toggleOrientation(){
        window.deviceOrientation = (window.deviceOrientation === 'portrait' ? 'landscape' : 'portrait' );
        document.documentElement.className = window.deviceOrientation;
        adjustScrollbarPaddingForMac();
        var radios = document.getElementsByName('slider');
        for (var i = 0, length = radios.length; i < length; i++) {
            if (radios[i].checked) {
                var sel = radios[i];
                if( sel.id === 'iphoneRadio'){
                    openIphone();
                }
                else if( sel.id === 'ipadRadio'){
                    openIpad();
                }
                
                else if( sel.id === 'nexus4Radio'){
                    openNexus4();
                }
                else if( sel.id === 'nexus7Radio'){
                    openNexus7();
                }
                else if( sel.id === 'bbz10Radio'){
                    openBBZ10();
                }
                break;
            }
        }
    }
    function adjustScrollbarPaddingForMac(){
        if (navigator.appVersion.indexOf("Mac")!=-1 && navigator.userAgent.indexOf('Firefox') == -1){
            document.documentElement.className += " mac";
        }
    }
    window.deviceOrientation = document.documentElement.className = 'portrait';
    adjustScrollbarPaddingForMac();
    
    </script>

</body>
</html>
