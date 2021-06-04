Website_URL = "https://robotsparebinindustries.com/#/robot-order"
Loc_Address = "xpath://input[@id='address']"

from RPA.Robocloud.Secrets import Secrets

secrets = Secrets()
Website_URL = secrets.get_secret("VaultOne")["Website_URL"]

