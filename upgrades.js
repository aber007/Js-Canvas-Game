export class Upgrades {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.visible = false;
    this.upgrades = {};
    this.upgrades["dmg1"] = {
      name: "Damage",
      previous: "",
      unlocked: false,
      repurchase: false,
      level: 0,
      costgray: 1,
      constyellow: 0,
      costblue: 0,
      description: "Increase damage by 1",
      x: 0,
      y: 0,
    };
    this.upgrades["dmg2"] = {
      name: "Damage",
      previous: "dmg1",
      unlocked: false,
      repurchase: false,
      level: 0,
      costgray: 1,
      constyellow: 0,
      costblue: 0,
      description: "Increase damage by 1",
      x : 0,
      y : 0,
    };
    this.upgrades["health"] = {
      name: "Health",
      id: "hp1",
      unlocked: false,
      repurchase: false,
      level: 0,
      costgray: 1,
      constyellow: 0,
      costblue: 0,
      description: "Increase health by 1",
      x : 0,
      y : 0,
    };
  }
  fixPositionOfUpgradeButons() {

  } 


  showUpgradeShop() {
    
    const upgradebackground = document.createElement("div");
    upgradebackground.id = "upgradebackground";
    upgradebackground.style.zIndex = "10";
    upgradebackground.style.position = "absolute";
    upgradebackground.style.top = "64px";
    upgradebackground.style.left = "50%";
    upgradebackground.style.transform = "translateX(-50%)";
    upgradebackground.style.width = "1536px";
    upgradebackground.style.height = "704px";
    upgradebackground.style.backgroundColor = "rgb(182, 164, 133)";
    upgradebackground.style.boxSizing = "border-box";
    upgradebackground.style.border = "2px solid rgba(184,111,80,1)";

    if (!this.visible) {
      console.log("Showing upgrade shop");
      this.visible = true;
      document.body.appendChild(upgradebackground);
    } else {
      console.log("Removing upgrade shop");
      this.visible = false;
      document.body.removeChild(document.getElementById("upgradebackground"));
    }
    
  }
}