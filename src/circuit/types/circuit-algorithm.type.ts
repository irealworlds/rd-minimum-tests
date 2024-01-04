import {TCircuitElement} from "./circuit-element.type";
import {IGate} from "../models/gates/gate.contract";

export type TCircuitAlgorithm = Partial<{
    [element in TCircuitElement]: IGate | TCircuitElement
}>;