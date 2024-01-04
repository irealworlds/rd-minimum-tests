import {TCircuitElement} from "../../types/circuit-element.type";
import {TCircuitOutputValue} from "../../types/circuit-output-value.type";
import {AndGate} from "./and.gate";

export class NandGate extends AndGate {
    compute(inputs: Partial<{ [label in TCircuitElement]: TCircuitOutputValue }>): TCircuitOutputValue {
        return !super.compute(inputs) ? 1 : 0;
    }
}