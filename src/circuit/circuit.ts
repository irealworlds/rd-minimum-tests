import {TCircuitAlgorithm} from "./types/circuit-algorithm.type";
import {NandGate} from "./models/gates/nand.gate";
import { CircuitConfiguration } from "./models/circuit-configuration.model";
import { CascadeFaultsConfiguration } from "./models/cascade-faults-configuration.model";
import {NotGate} from "./models/gates/not.gate";
import {IdentityGate} from "./models/gates/identity.gate.ts";

//export const circuitConfiguration = new CircuitConfiguration(
//        ["a", "b", "c"],
//        "z",
//        ["a", "b", "c", "d", "e", "h", "m", "n", "p", "z"],
//        new CascadeFaultsConfiguration({
//                d: ["e", "g"]
//        })
//);
//export const circuitAlgorithm: TCircuitAlgorithm = {
//        a: "a",
//        b: "b",
//        c: "c",
//
//        d: new NandGate("a", "b", "c"),
//
//        e: "d",
//        
//        h: "a",
//
//        m: "c",
//        n: new NotGate("m"),
//        p: "n",
//
//        z: new NandGate("e", "h", "p")
//};

export const circuitConfiguration = new CircuitConfiguration(
        ["a", "b", "c"],
        "z",
        ["a", "b", "c", "d", "e", "f", "m", "n", "p", "z"],
        new CascadeFaultsConfiguration({
                d: ["e", "g"]
        })
);
export const circuitAlgorithm: TCircuitAlgorithm = {
        a: "a",
        b: "b",
        c: "c",

        d: new NandGate("a", "b", "c"),

        e: "d",
        f: "d",

        m: "d",
        n: new IdentityGate("m"),
        p: "n",

        z: new NandGate("e", "f", "p")
};