import React from 'react';
import * as THREE from 'three';
import SceneInit from '../lib/SceneInit';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const Three = () => {
    React.useEffect(() => {
        const cameraPosition = new THREE.Vector3(0,1,1.5);

        const scene = new SceneInit('Bg3D', cameraPosition, true);

        const pointLight = new THREE.PointLight(0xffffff, 1, 100);
        pointLight.position.set(1, 2, 0);
        pointLight.castShadow = true;
        scene.add(pointLight);

        const gltfLoader = new GLTFLoader();
        let textObject1 : any = undefined;
        let textObject2 : any = undefined;
        let up = true;
        gltfLoader.load('/assets/gltf/Scene.gltf', (gltf) => {
            const root = gltf.scene;

            root.position.x = 0;
            root.position.y = -.7;
            root.position.z = .2;
            root.rotateX(-Math.PI / 8);
            scene.scene.add(root);
            root.children.forEach(child => {
                child.children.forEach(child => {
                    // if (child.name === "Sphere001")
                    //     child.removeFromParent();
                    // if (child.name === "Sphere002")
                    //     child.removeFromParent();
                    // if (child.name === "Sphere")
                    //     child.removeFromParent();
                    if (child.name === "Text001")
                        textObject1 = child
                    else if (child.name === "Text002")
                        textObject2 = child
                })
            })

        })

        const animate = () => {
            requestAnimationFrame(animate);
            if (textObject1)
                if (textObject1.position.y > 1.1)
                    up = false
                else if (textObject1.position.y < 0.7)
                    up = true
            if (textObject1)
                if (up)
                    textObject1.position.y += .01;
                else 
                    textObject1.position.y -= .01;
                if (textObject2)
                    if (up)
                        textObject2.position.y += .01;
                    else 
                        textObject2.position.y -= .01;
            scene.controls.update();
            scene.stats.update();
            scene.renderer.render(scene.scene, scene.camera);
        }
        // add this animation to the scene
        scene.animate = animate;

        scene.animate();
    }, [])
    return (<></>)
}

export default Three;