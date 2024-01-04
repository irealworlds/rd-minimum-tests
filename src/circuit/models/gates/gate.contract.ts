import {TCircuitElement} from "../../types/circuit-element.type";
import {TCircuitOutputValue} from "../../types/circuit-output-value.type";

export interface IGate {
    compute(inputs: Partial<{
        [label in TCircuitElement]: TCircuitOutputValue
    }>): TCircuitOutputValue;
}