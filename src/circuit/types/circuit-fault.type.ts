import {TCircuitElement} from "./circuit-element.type";
import {TCircuitOutputValue} from "./circuit-output-value.type";

export type TCircuitFault = {
    element: TCircuitElement,
    value: TCircuitOutputValue
};