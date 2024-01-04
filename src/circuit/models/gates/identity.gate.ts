import {IGate} from "./gate.contract";
import {TCircuitInput} from "../../types/circuit-input.type";
import {TCircuitElement} from "../../types/circuit-element.type";
import {TCircuitOutputValue} from "../../types/circuit-output-value.type";

export class IdentityGate implements IGate {
    constructor(
        public inputLabel: TCircuitElement
    ) {
    }

    compute(inputs: Partial<{ [label in TCircuitElement]: TCircuitOutputValue }>): TCircuitOutputValue {
        return inputs[this.inputLabel];
    }
}