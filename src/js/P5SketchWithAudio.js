import React, { useRef, useEffect } from "react";
import "./helpers/Globals";
import "p5/lib/addons/p5.sound";
import * as p5 from "p5";
import { Midi } from '@tonejs/midi'
import Diamond from './classes/Diamond.js';
import { TetradicColourCalculator } from './functions/ColourCalculators';
import PlayIcon from './functions/PlayIcon.js';

import audio from "../audio/diamonds-no-1.ogg";
import midi from "../audio/diamonds-no-1.mid";

const P5SketchWithAudio = () => {
    const sketchRef = useRef();

    const Sketch = p => {

        p.canvas = null;

        p.canvasWidth = window.innerWidth;

        p.canvasHeight = window.innerHeight;

        p.audioLoaded = false;

        p.player = null;

        p.PPQ = 3840 * 4;

        p.loadMidi = () => {
            Midi.fromUrl(midi).then(
                function(result) {
                    console.log(result);
                    const noteSet1 = result.tracks[2].notes; // Synth 1 - Dark Power Lead
                    const noteSet2 = result.tracks[6].notes; // Sampler 1 - Synthoni
                    p.scheduleCueSet(noteSet1, 'executeCueSet1');
                    p.scheduleCueSet(noteSet2, 'executeCueSet2');
                    p.audioLoaded = true;
                    document.getElementById("loader").classList.add("loading--complete");
                    document.getElementById("play-icon").classList.remove("fade-out");
                }
            );
            
        }

        p.preload = () => {
            p.song = p.loadSound(audio, p.loadMidi);
            p.song.onended(p.logCredits);
        }

        p.scheduleCueSet = (noteSet, callbackName, poly = false)  => {
            let lastTicks = -1,
                currentCue = 1;
            for (let i = 0; i < noteSet.length; i++) {
                const note = noteSet[i],
                    { ticks, time } = note;
                if(ticks !== lastTicks || poly){
                    note.currentCue = currentCue;
                    p.song.addCue(time, p[callbackName], note);
                    lastTicks = ticks;
                    currentCue++;
                }
            }
        } 

        p.gridCoords = [];

        p.diamonds = [];

        p.bigDiamonds = [];

        p.setup = () => {
            p.canvas = p.createCanvas(p.canvasWidth, p.canvasHeight);
            p.colorMode(p.HSB);
            p.baseHue = p.random(0, 360);
            p.colourSet = TetradicColourCalculator(p, p.baseHue);
            p.background(0);
            for (let i = 0; i < 11; i++) {
                if(i > 0){
                    p.gridCoords.push(
                        {
                            x: p.width / 11 * i,
                            y: p.height / 4 * 1,
                        }
                    );
                    p.gridCoords.push(
                        {
                            x: p.width / 11 * i,
                            y: p.height / 4 * 3,
                        }
                    );
                }
                
                p.gridCoords.push(
                    {
                        x: p.width / 11 * i + (p.width / 22),
                        y: p.height / 2,
                    }
                );
            }
        }

        p.draw = () => {
            if(p.audioLoaded && p.song.isPlaying()){
                p.background(0);
                for (let i = 0; i < p.bigDiamonds.length; i++) {
                    const diamond = p.bigDiamonds[i];
                    diamond.update();
                    diamond.draw();
                }
                for (let i = 0; i < p.diamonds.length; i++) {
                    const diamond = p.diamonds[i];
                    diamond.update();
                    diamond.draw();
                }
            }
        }

        p.executeCueSet1 = (note) => {
            const { currentCue } = note, 
             coOrds = p.gridCoords[(currentCue - 1) % 31], 
             { x, y } = coOrds; 
            p.diamonds[(currentCue - 1) % 31] =
                new Diamond(
                    p,
                    x,
                    y,
                    p.random(0, 360),
                    p.height / 2
                );
        }

        p.baseBigDiamondSize = 0;

        p.executeCueSet2 = (note) => {
            const { currentCue } = note 
            if(!p.baseBigDiamondSize) {
                p.baseBigDiamondSize = p.width * 8 / 3;
            }
            
            p.bigDiamonds.push(
                new Diamond(
                    p,
                    p.width / 2,
                    p.height / 2,
                    p.random(0, 360),
                    p.baseBigDiamondSize, 
                    0.02 * currentCue, 
                    8
                )
            );

            if(currentCue > 10) {
                p.bigDiamonds.push(
                    new Diamond(
                        p,
                        p.width / 4 * 1,
                        p.height / 2,
                        p.random(0, 360),
                        p.baseBigDiamondSize, 
                        0.25, 
                        8
                    )
                );
                p.bigDiamonds.push(
                    new Diamond(
                        p,
                        p.width / 4 * 3,
                        p.height / 2,
                        p.random(0, 360),
                        p.baseBigDiamondSize, 
                        0.25, 
                        8
                    )
                );
            }

            if(currentCue > 5) {
                p.baseBigDiamondSize = p.baseBigDiamondSize * 0.95;
            }
        }

        p.hasStarted = false;

        p.mousePressed = () => {
            if(p.audioLoaded){
                if (p.song.isPlaying()) {
                    p.song.pause();
                } else {
                    if (parseInt(p.song.currentTime()) >= parseInt(p.song.buffer.duration)) {
                        p.reset();
                        window.dataLayer.push(
                            { 
                                'event': 'play-animation',
                                'animation': {
                                    'title': document.title,
                                    'location': window.location.href,
                                    'action': 'replaying'
                                }
                            }
                        );
                    }
                    document.getElementById("play-icon").classList.add("fade-out");
                    p.canvas.addClass("fade-in");
                    p.song.play();
                    if (typeof window.dataLayer !== typeof undefined && !p.hasStarted){
                        window.dataLayer.push(
                            { 
                                'event': 'play-animation',
                                'animation': {
                                    'title': document.title,
                                    'location': window.location.href,
                                    'action': 'start playing'
                                }
                            }
                        );
                        p.hasStarted = false
                    }
                }
            }
        }

        p.creditsLogged = false;

        p.logCredits = () => {
            if (
                !p.creditsLogged &&
                parseInt(p.song.currentTime()) >= parseInt(p.song.buffer.duration - 1)
            ) {
                p.creditsLogged = true;
                    console.log(
                    "Music By: http://labcat.nz/",
                    "\n",
                    "Animation By: https://github.com/LABCAT/"
                );
                p.song.stop();
                document.getElementById("play-icon").classList.remove("fade-out");
            }
        };

        p.reset = () => {
            const coOrds = p.gridCoords[0], 
                 { x, y } = coOrds; 
            p.clear();
            p.diamonds = [];
            p.bigDiamonds = [];
            p.baseBigDiamondSize = p.width * 8 / 3;
            p.diamonds[0] =
                new Diamond(
                    p,
                    x,
                    y,
                    p.random(0, 360),
                    p.height / 2
                );
            
            p.bigDiamonds.push(
                new Diamond(
                    p,
                    p.width / 2,
                    p.height / 2,
                    p.random(0, 360),
                    p.baseBigDiamondSize, 
                    0.02, 
                    8
                )
            );
        }

        p.updateCanvasDimensions = () => {
            p.canvasWidth = window.innerWidth;
            p.canvasHeight = window.innerHeight;
            p.canvas = p.resizeCanvas(p.canvasWidth, p.canvasHeight);
        }

        if (window.attachEvent) {
            window.attachEvent(
                'onresize',
                function () {
                    p.updateCanvasDimensions();
                }
            );
        }
        else if (window.addEventListener) {
            window.addEventListener(
                'resize',
                function () {
                    p.updateCanvasDimensions();
                },
                true
            );
        }
        else {
            //The browser does not support Javascript event binding
        }
    };

    useEffect(() => {
        new p5(Sketch, sketchRef.current);
    }, []);

    return (
        <div ref={sketchRef}>
            <PlayIcon />
        </div>
    );
};

export default P5SketchWithAudio;
