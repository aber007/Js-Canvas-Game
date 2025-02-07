export class Upgrades {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.upgrades = {};
    this.upgrades["damage"] = {
      name: "Damage",
      level: 0,
      costgray: 1,
      constyellow: 0,
      costblue: 0,
      maxLevel: 10,
      description: "Increase damage by 1",
    };
    this.upgrades["attack_speed"] = {
      name: "Attack Speed",
      level: 0,
      costgray:0 ,
      constyellow: 1,
      costblue: 0,
      maxLevel: 10,
      description: "Increase attack speed by 1",
    };
    this.upgrades["special"] = {
      name: "Special",
      level: 0,
      costgray: 0,
      constyellow: 1,
      costblue: 2,
      maxLevel: 1,
      description: "Unlock special attack",
    };
    this.upgrades["special_damage"] = {
      name: "Special Damage",
      level: 0,
      costgray: 0,
      constyellow: 1,
      costblue: 0,
      maxLevel: 10,
      description: "Increase special damage by 1",
    };
  }
  showUpgradeShop() {
    console.log("Showing upgrade shop");
    // Make background white
    this.ctx.fillStyle = "white";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "black";
    this.ctx.font = "20px Arial";
    this.ctx.fillText("Upgrade Shop", 32, 32);
    let y = 64;
    for (let upgrade in this.upgrades) {
      console.log(upgrade);
      const upgradeData = this.upgrades[upgrade];
      this.ctx.fillText(
        `${upgradeData.name}: ${upgradeData.level}/${upgradeData.maxLevel}`,
        32,
        y
      );
      y += 32;
      this.ctx.fillText(`${upgradeData.description}`, 32, y);
      y += 32;
      this.ctx.fillText(
        `Cost: ${upgradeData.costgray} gray, ${upgradeData.constyellow} yellow, ${upgradeData.costblue} blue`,
        32,
        y
      );
      y += 32;
    }
  }
}