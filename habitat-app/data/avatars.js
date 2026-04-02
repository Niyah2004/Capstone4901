export const AVATARS = {
    panda: {
        base: require("../assets/panda.png"),
        accessories: {
            sleepmask: {
                image: require("../assets/panda/accessories/sleepmask.png"),
                cost: 75,
                position: { top: -15, left: 42, size: 230 },
            },
        },
        hats: {
            hat: {
                image: require("../assets/panda/hats/hat.png"),
                cost: 80,
                position: { top: -63.4, left: 63.9, size: 200 },
            },
        },
        
        tops : {
            hoodie: {  
                image: require("../assets/panda/tops/hoodie.png"),
                cost: 200,
                position: { top: 137, left: 74.6, size: 148.9 },
            },
            top: {
                image: require("../assets/panda/tops/top.png"),
                cost: 100,
                position: { top: 130, left: 75, size: 147 },
            }
        },
        pants: {
            pant: {
                image: require("../assets/panda/pants/pant.png"),
                cost: 100,
                position: { top: 185, left: 83.1, size: 134.9 },
            },
        },
        shoes : {
            slippers: {
                image: require("../assets/panda/shoes/slippers.png"),
                cost: 90,
                position: { top: 213, left: 82, size: 135 },
            },
        },
    },

    turtle: {
        base: require("../assets/turtle.png"),
        accessories: {
            turtle_mask: {
                image: require("../assets/turtle/accessories/turtle_mask.png"),
                cost: 0,
                position: { top: 4, left: 12, size: 240 },
            },
            turtle_bowtie: {
                image: require("../assets/turtle/accessories/turtle_bowtie.png"),
                cost: 50,
                position: { top: 142, left: 105, size: 100 },
            },
        },
        tops: {
            turtle_hoodie: {
                cost: 100,
                image: require("../assets/turtle/tops/turtle_hoodie.png"),
                position: { top: 102, left: 57, size: 200 },
            }
        },
        pants: {
            turtle_pants: {
                cost: 0,
                image: require("../assets/turtle/pants/turtle_sweatpants.png"),
                position: { top: 198, left: 86, size: 136 },
            }
        },
    },
    dino: {
        base: require("../assets/dino.png"),
        accessories: {
            dog: {
                image: require("../assets/dino/accessories/dinoDog.png"),
                cost: 75,
                position: { top: 190, left: 188, size: 130 },
            },
            scarf: {
                image: require("../assets/dino/accessories/dinoScarf.png"),
                cost: 70,
                position: { top: 160, left: 97, size: 110 },
            },
            
        },
        hats: {
            hat: {
                image: require("../assets/dino/hats/dinoHat.png"),
                cost: 100,
                position: { top: -50, left: 54, size: 200 },
            },
        },
        shoes: {
            sneakers: {
                image: require("../assets/dino/shoes/dinoSkates.png"),
                cost: 90,
                position: { top: 213, left: 85, size: 135 },
            },
        },
    },
    lion: {
        base: require("../assets/lion.png"),
        backgrounds: {
            pinkBubbles: {
                image: require("../assets/lion/accessories/pinkBubbles.png"),
                cost: 80,
                position: { top: -80, left: -40, size: 400 },
            },
            redCape: {
                image: require("../assets/lion/tops/redCape.png"),
                cost: 100,
                position: { top: 145, left: 65, size: 190 },
            },
        },
        hats: {
            goldCrown: {
                image: require("../assets/lion/hats/goldCrown.png"),
                cost: 90,
                position: { top: -25, left: 85, size: 110 },
            },
        },
        accessories: {
            pinkScarf: {
                image: require("../assets/lion/accessories/pinkScarf.png"),
                cost: 75,
                position: { top: 155, left: 90, size: 140 },
            },
        },
    },
        penguin: {
        base: require("../assets/penguin.png"),
        accessories: {
            surfboard: {
                image: require("../assets/penguin/accessories/surfboard.png"),
                cost: 150,
                position: { top: 4, left: 125, size: 325 },
            },
        },
        hats: {
            hat: {
                image: require("../assets/penguin/accessories/hat.png"),
                cost: 0,
                position: { top: -75, left: 25, size: 250 },
            },
        },
        
        tops : {
            top: {
                image: require("../assets/penguin/tops/wetsuit.png"),
                cost: 50,
                position: { top: 23, left: -5, size: 300 },
            }
        },
        shoes : {
            snorkelfins: {
                image: require("../assets/penguin/shoes/wetshoes.png"),
                cost: 100,
                position: { top: 40, left: 15, size: 275 },
            },
        },
    },
};
