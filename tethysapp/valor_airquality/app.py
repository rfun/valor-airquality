from tethys_sdk.base import TethysAppBase, url_map_maker


class ValorAirquality(TethysAppBase):
    """
    Tethys app class for Team Valor   Air Quality.
    """

    name = 'Team Valor   Air Quality'
    index = 'valor_airquality:home'
    icon = 'valor_airquality/images/icon.gif'
    package = 'valor_airquality'
    root_url = 'valor-airquality'
    color = '#64b5f6'
    description = 'Monitor Air Quality in your neighborhood'
    tags = ''
    enable_feedback = False
    feedback_emails = []

    def url_maps(self):
        """
        Add controllers
        """
        UrlMap = url_map_maker(self.root_url)

        url_maps = (
            UrlMap(
                name='home',
                url='valor-airquality',
                controller='valor_airquality.controllers.home'
            ),
        )

        return url_maps
