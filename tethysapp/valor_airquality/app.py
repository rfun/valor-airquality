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
    color = '#2c3e50'
    description = 'Place a brief description of your app here.'
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
            UrlMap(
                name='proposal',
                url='valor_airquality/proposal',
                controller='valor_airquality.controllers.proposal'
            ),

            UrlMap(
                name='mockups',
                url='valor_airquality/mockups',
                controller='valor_airquality.controllers.mockups'
            ),
        )

        return url_maps
