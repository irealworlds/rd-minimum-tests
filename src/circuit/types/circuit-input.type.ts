import {TCircuitElement} from "./circuit-element.type";
import {TCircuitOutputValue} from "./circuit-output-value.type";

export type TCircuitInput = Partial<{
    [label in TCircuitElement]: TCircuitOutputValue
}>;