import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'

export default class SceneInit {

    public fov : number
    public scene : THREE.Scene
    public camera : THREE.PerspectiveCamera
    public renderer : THREE.WebGLRenderer
    public controls : OrbitControls
    public stats : Stats
    public sceneId : string


    constructor(sceneId : string, cameraPosition? : THREE.Vector3, resize? : boolean) {
        this.fov = 75
        this.scene = new THREE.Scene()
        this.camera = new THREE.PerspectiveCamera(this.fov,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        )
        if (cameraPosition) {
            this.camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z)
        } else {
            this.camera.position.set(0, 0, 0)
        }
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById(sceneId) as HTMLCanvasElement,
            antialias: true
        })
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.renderer.setPixelRatio(window.devicePixelRatio)
        this.controls = new OrbitControls(this.camera, this.renderer.domElement)
        this.stats = new Stats()
        // document.body.appendChild(this.stats.dom)
        this.sceneId = sceneId
        if (resize) {
            window.addEventListener('resize', () => {
                this.renderer.setSize(window.innerWidth, window.innerHeight)
                this.camera.aspect = window.innerWidth / window.innerHeight
                this.camera.updateProjectionMatrix()
            })
        }
    }

    add(object : THREE.Object3D) {
        this.scene.add(object)
    }

    animate() {
        requestAnimationFrame(() => this.animate())
        this.controls.update()
        // this.stats.update()
        this.renderer.render(this.scene, this.camera)
    }
}