from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from tethys_sdk.gizmos import Button, RangeSlider, MessageBox

def home(request):
    

    gp_button = Button(
    display_text='Run',
    name='gp_button',
    icon='glyphicon glyphicon-globe',
    attributes={
        'data-toggle':'tooltip',
        'data-placement':'top',
        'title':'Run GeoProcessing Service'
        }
    )

    slider1 = RangeSlider(display_text='Distance around your location (in miles)',
                          name='distance_slider',
                          min=1,
                          max=10,
                          initial=2,
                          step=1
    )

    info_box = MessageBox(name='info_box',
                         title='Info',
                         message='Click on the map within the SLC county. Select your buffer distance and then click on Run. This service takes about 15s to run.',
                         affirmative_button='Ok',
                         width=400,
                         affirmative_attributes='href=javascript:void(0);'
    )

    refresh_button = Button(
        display_text='Refresh',
        name='button',
        attributes={
            'data-toggle': 'tooltip',
            'data-placement': 'top',
            'title': 'refresh',
            'onclick':'app.refresh()'

        },
    )

    return render(request, 'valor_airquality/home-map.html', {'gp_button':gp_button,'slider1':slider1, 'info_box':info_box, 'refresh_button':refresh_button})


def info(request):
    return render(request, 'valor_airquality/home.html', {})


def proposal(request):
    """
    proposal page for my app
    """
    context={


    }

    return render(request, 'valor_airquality/proposal.html', context)

def mockups(request):
    """
    mockups page for my app
    """
    context={


    }

    return render(request, 'valor_airquality/mockups.html', context)
