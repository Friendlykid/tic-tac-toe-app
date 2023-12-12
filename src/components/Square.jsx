import * as PropTypes from "prop-types";

export default function Square({ value, onSquareClick, disabled }) {
  return (
    <button className="square" onClick={onSquareClick} disabled={disabled}>
      {value}
    </button>
  );
}
Square.propTypes = {
  value: PropTypes.string,
  onSquareClick: PropTypes.func,
  disabled: PropTypes.bool,
};
