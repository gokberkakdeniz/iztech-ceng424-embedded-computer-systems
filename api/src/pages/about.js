import { PrivateWrapper } from "../containers/wrappers";

function AboutPage() {
  return (
    <PrivateWrapper>
      <div className="text-center">
        <h2 className="text-xl font-bold text-yellow-500">
          Rodones General Purpose Weather Measurement System
        </h2>

        <p>
          Plug and Play embedded system that collects data through desired
          sensors, and triggers actions on certain con- ditions defined by user.
          Prototype board consists of NodeMCU development board, various addable
          removeable sensors, MQTT protocol and Timescale DB. This general
          purpose system aims to satisfy all kinds of user needs for all kinds
          of stuff. System will have ability to take user-defined actions and
          add/remove supported sensors.
        </p>
        <br />

        <h3 className="text-lg font-bold text-yellow-500">Authors</h3>
        <ul className="">
          <li>
            <a className="hover:underline" href="https://akdeniz.dev">
              Gökberk Akdeniz
            </a>
          </li>
          <li>
            <a className="hover:underline" href="https://github.com/ebkaracaa">
              Emre Baran KARACA
            </a>
          </li>
          <li>
            <a className="hover:underline" href="https://hakanalp.dev">
              Hakan Alp
            </a>
          </li>
        </ul>
      </div>
    </PrivateWrapper>
  );
}

export default AboutPage;
