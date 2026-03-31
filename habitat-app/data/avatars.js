export const AVATARS = {
    panda: {
        base: require("../assets/panda.png"),
        accessories: {
            sleepmask: {
                image: require("../assets/panda/accessories/sleepmask.png"),
                cost: 0,
                position: { top: -15, left: 42, size: 230 },
            },
        },
        hats: {
            hat: {
                image: require("../assets/panda/hats/hat.png"),
                cost: 50,
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
                cost: 150,
                position: { top: 185, left: 83.1, size: 134.9 },
            },
        },
        shoes : {
            slippers: {
                image: require("../assets/panda/shoes/slippers.png"),
                cost: 150,
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
                position: { top: -43, left: -37, size: 375 },
            },
            turtle_bowtie: {
                image: require("../assets/turtle/accessories/turtle_bowtie.png"),
                cost: 50,
                position: { top: 140, left: 100, size: 100 },
            },
        },
        tops: {
            turtle_hoodie: {
                cost: 100,
                image: require("../assets/turtle/tops/turtle_hoodie.png"),
                position: { top: -50, left: -50, size: 400 },
            }
        },
        pants: {
            turtle_pants: {
                cost: 200,
                image: require("../assets/turtle/pants/turtle_sweatpants.png"),
                position: { top: -60, left: -50, size: 400 },
            }
        },
    },
    dino: {
        base: require("../assets/dino.png"),
        accessories: {
            scarf: {
                image: require("../assets/dino/accessories/dinoScarf.png"),
                cost: 0,
                position: { top: 160, left: 97, size: 110 },
            },
            dog: {
                image: require("../assets/dino/accessories/dinoDog.png"),
                cost: 200,
                position: { top: 190, left: 188, size: 130 },
            },
            
        },
        shoes: {
            sneakers: {
                image: require("../assets/dino/shoes/dinoSkates.png"),    
                cost: 100,
                position: { top: 213, left: 85, size: 135 },
            },
        },
        hats: {
            hat: {
                image: require("../assets/dino/hats/dinoHat.png"),
                cost: 50,
                position: { top: -50, left: 54, size: 200 },
            },
        },
        shoes: {
            sneakers: {
                image: require("../assets/dino/shoes/dinoSkates.png"),
                cost: 150,
                position: { top: 213, left: 85, size: 135 },
            },
        },
    },
    lion: {
        base: require("../assets/lion.png"),
        accessories: {
            bowtie: {
                image: require("../assets/lion/accessories/bowtie.png"),
                cost: 0,
                position: { top: 170, left: 103, size: 100 },
            },
            sunglasses: {
                image: require("../assets/lion/accessories/sunglasses.png"),
                cost: 50,
                position: { top: 30, left: 65, size: 170 },
            },
            
        },
        hats: {
            crown: {
                image: require("../assets/lion/hats/crown.png"),
                cost: 200,
                position: { top: -55, left: 60, size: 190 },
            },
        },
        
        tops: {
            cape: {
                image: require("../assets/lion/tops/cape.png"),
                cost: 150,
                position: { top: 120, left: 55, size: 200 },
            },
        },
        shoes: {
            sneakers: {
                image: require("../assets/lion/shoes/sneakers.png"),
                cost: 100,
                position: { top: 220, left: 80, size: 140 },
            },
        },
    },
};
