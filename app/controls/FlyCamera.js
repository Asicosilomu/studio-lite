import { PointerLockControls } from "./PointerLockControls.js";

export default class FlyCamera {
	/**
	 * 
	 * @param {*} cam THREE.PerspectiveCamera to control
	 * @param {*} domElement The DOM element to listen for click & key events on
	 */
	constructor(cam, domElement) {
		this.cam = cam;
		this.domElement = domElement;
		this.movementSpeed = 0;
		this.horizontalMovementSpeed = 0;
		this.verticalMovementSpeed = 0;
		this.flySpeed = 5;
		// this.lookSpeed = 0.005;
		this.controls = new PointerLockControls(this.cam, this.domElement);

		/**
		 * Locks mouse on click
		 */
		domElement.addEventListener('click', () => {
			this.controls.lock();
		});
		/**
		 * Sets movement directions based on key presses
		 */
		window.addEventListener("keydown", (e) => {
			if (!this.controls.isLocked) return;
			switch (e.code) {
				case "KeyW":
					this.moveForward = true;
					break;
				case "KeyS":
					this.moveBackward = true;
					break;
				case "KeyA":
					this.moveLeft = true;
					break;
				case "KeyD":
					this.moveRight = true;
					break;
				case "KeyE":
					this.moveUp = true;
					break;
				case "KeyQ":
					this.moveDown = true;
					break;
			}
		});
		/**
		 * Sets movement directions based on key releases
		 */
		window.addEventListener("keyup", (e) => {
			if (!this.controls.isLocked) return;
			switch (e.code) {
				case "KeyW":
					this.moveForward = false;
					break;
				case "KeyS":
					this.moveBackward = false;
					break;
				case "KeyA":
					this.moveLeft = false;
					break;
				case "KeyD":
					this.moveRight = false;
					break;
				case "KeyE":
					this.moveUp = false;
					break;
				case "KeyQ":
					this.moveDown = false;
					break;
			}
		});
	}
	/**
	 * Updates this.cam position based on movement directions
	 * @param {number} dt 
	 */
	update(dt) {
		if (!this.controls.isLocked) return;
		// console.log(this.moveForward);
		if (this.moveForward) {
			// console.log("forward");
			if (this.movementSpeed < 50) {
				this.movementSpeed += this.flySpeed;
			}
		} else if (this.moveBackward) {
			if (this.movementSpeed > -50) {
				this.movementSpeed -= this.flySpeed;
			}
		} else {
			if (this.movementSpeed > 0) {
				this.movementSpeed -= this.flySpeed;
			} else if (this.movementSpeed < 0) {
				this.movementSpeed += this.flySpeed;
			}
		}
		if (this.moveLeft) {
			if (this.horizontalMovementSpeed > -50) {
				this.horizontalMovementSpeed -= this.flySpeed;
			}
		} else if (this.moveRight) {
			if (this.horizontalMovementSpeed < 50) {
				this.horizontalMovementSpeed += this.flySpeed;
			}
		} else {
			if (this.horizontalMovementSpeed > 0) {
				this.horizontalMovementSpeed -= this.flySpeed;
			} else if (this.horizontalMovementSpeed < 0) {
				this.horizontalMovementSpeed += this.flySpeed;
			}
		}
		if (this.moveUp) {
			if (this.verticalMovementSpeed < 50) {
				this.verticalMovementSpeed += this.flySpeed;
			}
		} else if (this.moveDown) {
			if (this.verticalMovementSpeed > -50) {
				this.verticalMovementSpeed -= this.flySpeed;
			}
		} else {
			if (this.verticalMovementSpeed > 0) {
				this.verticalMovementSpeed -= this.flySpeed;
			} else if (this.verticalMovementSpeed < 0) {
				this.verticalMovementSpeed += this.flySpeed;
			}
		}
		this.cam.translateX(this.horizontalMovementSpeed * dt);
		this.cam.translateY(this.verticalMovementSpeed * dt);
		this.cam.translateZ(-this.movementSpeed * dt);
	}
}